import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { GetRoutes, GetLocations, GetFares, GetLocations2 } from '../lib/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { images, icons } from "../constants"
const { width, height } = Dimensions.get('window');
import { router } from "expo-router";
import { useGlobalContext } from "../context/GlobalProvider";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";

export default function Main() {
  const db = useSQLiteContext();
  const { loading, isLogged } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // // Ensure the database connection is valid
        // if (!db) {
        //   console.error('Database connection is not available');
        //   return;
        // }
  
        // // Initialize the database if needed
        // if (!isDbInitialized) {
        //   await migrateDbIfNeeded(db);
        //   setIsDbInitialized(true);
        // }
  
        // Insert data
        await insertRoutes();
        await insertLocations();
        await insertFares();
  
        setMessage('Data initialization complete');
        console.log(message);
        setIsLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        setIsLoading(false);
      }
    };
  
    initializeData();
  }, [db]); // Ensure db is a dependency

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
              route.From,
              route.To,
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

  const insertLocations = async () => {
    try {
      let offset = await getOffset("location_offset");
      let offset2 = await getOffset("location_offset2"); // New offset for location_offset2
      if (offset === 0) {
        await updateOffset("location_offset", 0);
        offset = await getOffset("location_offset");
      }

      while (true) {
        const result = await GetLocations(offset);
        console.log(`insertLocations - offset: ${offset}, result length: ${result.length}`);
        if (result.length === 0) break;
        for (const location of result) {
          await db.runAsync(
            'INSERT INTO locations (Name, Coordinates,single,OSM) VALUES (?, ?,?,?);',
            [location.Name, location.Location, location.single, location.OSM]
          );
        }
        offset += result.length;
        await updateOffset("location_offset", result.length);
        if (result.length < 45) break;
      }

      while (true) {
        const result2 = await GetLocations2(offset2);
        console.log(`insertLocations - offset2: ${offset2}, result length: ${result2.length}`);
        if (result2.length === 0) break;
        for (const location of result2) {
          await db.runAsync(
            'INSERT INTO locations (Name, Coordinates,Coordinates2,single,OSM) VALUES (?,?,?,?,?);',
            [location.Name, location.Location, location.Location1, location.single, location.OSM]
          );
        }
        offset2 += result2.length;
        await updateOffset("location_offset2", result2.length);
        if (result2.length < 45) break;
      }
    } catch (error) {
      console.error(`insertLocations - error: ${error}`);
    }
  };

  const insertFares = async () => {
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
            [fares.vehicle, fares?.farePKM, fares?.fareMin, fares?.fareFixed]
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

  useEffect(() => {
    if (!loading && isLogged) {
      router.replace("/home");
    }
  }, [loading, isLogged]);

  return (
    <SafeAreaView style={{ height: "100%", backgroundColor: '#d1d9ed' }}>
      <ImageBackground
        source={images.travel2}
        style={{ width: '100%', height: height * 0.718 }}
        resizeMode='contain'
      >
        <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} />
      </ImageBackground>
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 40, marginBottom: 0, fontFamily: 'Ephesis-Regular', color: '#333', textAlign: 'center' }}>
          Travel With Us
        </Text>
        <TouchableOpacity
          disabled={isLoading}
          onPress={() => router.replace("/sign-in")}
          style={{
            backgroundColor: '#FF416C',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 15,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
          }}
        >
          {!isLoading ? (
            <Image
              source={icons.bus}
              style={{ width: 40, height: 45, transform: [{ scaleX: -1 }] }}
              resizeMode='contain'
            />
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      <StatusBar backgroundColor="" style="dark" />
    </SafeAreaView>
  );
}