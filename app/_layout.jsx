import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SplashScreen, Stack,router } from "expo-router";
import GlobalProvider from "../context/GlobalProvider";
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
    <GlobalProvider>
      <Stack >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="verifying" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </GlobalProvider>
  );
};

export default RootLayout;
