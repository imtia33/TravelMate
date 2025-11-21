import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../context/ThemeProvider"; // Import useTheme
import { COLORS } from "../../constants/theme";

const AuthLayout = () => {
  const { isDarkMode } = useTheme(); // Get theme context

  return (
    <>
      <Stack>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
            animation:'slide_from_left'
          }}
        />
        <Stack.Screen
          name="sign-up"

          options={{
            headerShown: false,
            animation:'slide_from_right'
          }}
        />
      </Stack>
      <StatusBar 
        backgroundColor={isDarkMode ? COLORS.dark.background : COLORS.light.background} 
        style={isDarkMode ? "light" : "dark"} 
      />
    </>
  );
};

export default AuthLayout;