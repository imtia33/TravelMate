import * as SQLite from "expo-sqlite";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetRoutes, GetFares, GetLocations2 } from '../lib/db';
  async function getOffset(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`getOffset - key: ${key}, value: ${value}`);
      return value !== null ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error(`getOffset - key: ${key}, error: ${error}`);
      return 0;
    }
  }

  async function updateOffset(key, count) {
    try {
      const currentOffset = await getOffset(key);
      const newOffset = currentOffset + count;
      await AsyncStorage.setItem(key, newOffset.toString());
      console.log(`updateOffset - key: ${key}, newOffset: ${newOffset}`);
    } catch (error) {
      console.error(`updateOffset - key: ${key}, error: ${error}`);
    }
  }

  const insertRoutes = async () => {
    const db=await SQLite.openDatabaseAsync("routes.db");
    try {
      let offset = await getOffset("route_offset");
      if (offset === 0) {
        await updateOffset("route_offset", 0);
        offset = await getOffset("route_offset");
      }

      while (true) {
        const result = await GetRoutes(offset);
        console.log(`insertRoutes - offset: ${offset}, result length: ${result.length}`);
        if (result.length === 0) break;
        for (const route of result) {
          await db.runAsync(
            'INSERT INTO routes ("From", "To", Vehicles, distanceKm, District) VALUES (?, ?, ?, ?, ?);',
            [
              route.From.trim(),
              route.To.trim(),
              JSON.parse(route.Vehicles),
              route.distanceKm,
              route.District,
            ]
          );
        }
        offset += result.length;
        await updateOffset("route_offset", result.length);
        if (result.length < 45) break;
      }
    } catch (error) {
      console.error(`insertRoutes - error: ${error}`);
    }
  };

 

  const insertFares = async () => {
    const db=await SQLite.openDatabaseAsync("routes.db");
    try {
      let offset = await getOffset("fare_offset");
      if (offset === 0) {
        await updateOffset("fare_offset", 0);
        offset = await getOffset("fare_offset");
      }

      while (true) {
        const result = await GetFares(offset);
        console.log(`insertFares - offset: ${offset}, result length: ${result.length}`);
        if (result.length === 0) break;
        for (const fares of result) {
          await db.runAsync(
            'INSERT INTO Fare (Vehicle, farePKM, fareMin, fareFixed) VALUES (?, ?, ?, ?);',
            [fares.vehicle.trim(), fares?.farePKM, fares?.fareMin, fares?.fareFixed]
          );
        }
        offset += result.length;
        await updateOffset("fare_offset", result.length);
        if (result.length < 45) break;
      }
    } catch (error) {
      console.error(`insertFares - error: ${error}`);
    }
  };
  
  export const InsertEverything=async()=>{
    await insertRoutes();
    
    await insertFares();
  }