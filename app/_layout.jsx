import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SplashScreen, Stack, } from "expo-router";
import GlobalProvider from "../context/GlobalProvider";
import { SQLiteProvider } from 'expo-sqlite';
SplashScreen.preventAutoHideAsync();
const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "pb": require("../assets/fonts/Poppins-Black.ttf"),
    "pbold": require("../assets/fonts/Poppins-Bold.ttf"),
    "pxb": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "pxl": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "pl": require("../assets/fonts/Poppins-Light.ttf"),
    "pm": require("../assets/fonts/Poppins-Medium.ttf"),
    "pregular": require("../assets/fonts/Poppins-Regular.ttf"),
    "psemibold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Pthin": require("../assets/fonts/Poppins-Thin.ttf"),
    "KolkerBrush-Regular": require("../assets/fonts/KolkerBrush-Regular.ttf"),
    "Ephesis-Regular": require("../assets/fonts/Ephesis-Regular.ttf"),
    "MS": require("../assets/fonts/MySoul.ttf"),
    "CV": require("../assets/fonts/Caveat.ttf"),
    "DS": require("../assets/fonts/DancingScript.ttf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }



  return (
    <SQLiteProvider
      databaseName="routes.db"
      onInit={createDbIfNeeded}
      onError={(error) => console.error('Database error:', error)}
    >
    <GlobalProvider>
      <Stack >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="advertisement" options={{ headerShown: false }} />
        <Stack.Screen name="travelplaces" options={{ headerShown: false }} />
        <Stack.Screen name="verifying" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </GlobalProvider>
    </SQLiteProvider>
  );
};
const createDbIfNeeded = async (db) => {
  try {
    await db.execAsync(
      `PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "From" TEXT NOT NULL,
        "To" TEXT NOT NULL,
        Vehicles TEXT,
        distanceKm REAL,
        District TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_from ON routes("From");
      
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "Name" TEXT NOT NULL,
        "Coordinates" TEXT,
        "single" BOOLEAN,
        "OSM" BOOLEAN,
        "District" TEXT
      );
      CREATE TABLE IF NOT EXISTS Fare (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Vehicle TEXT NOT NULL,
        farePKM REAL,
        fareMin REAL,
        fareFixed REAL
      );
      
      `
    );
  } catch (error) {
    console.error("Error creating database:", error);
  }
};

export default RootLayout;
