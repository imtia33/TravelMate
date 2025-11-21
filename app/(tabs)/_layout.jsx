"use client"

import React, { useState, useEffect } from "react"
import { View, Pressable, Dimensions, Keyboard, Platform, Animated, Image } from "react-native"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import * as Animatable from "react-native-animatable"
import { StatusBar } from "expo-status-bar"
import { useTheme } from "../../context/ThemeProvider"
import { COLORS } from "../../constants/theme"
import { icons } from "../../constants"

const { width } = Dimensions.get("window")
const PADDING = 20
const TAB_BAR_WIDTH = width - 2 * PADDING
const TAB_WIDTH = TAB_BAR_WIDTH / 2

const TabIcon = ({ icon, name, focused, isDarkMode, isRouteTab }) => {
  // Text color - white in dark mode, dark in light mode
  const textColor = isDarkMode ? "#FFFFFF" : "#19191D";
  
  // Use custom images for home and map icons
  if (name === "home") {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", width: TAB_WIDTH }}>
        <Image 
          source={isDarkMode ? icons.homeLight : icons.homeDark} 
          style={{ 
            width: 28, 
            height: 28
          }} 
        />
        <Animatable.Text
          animation={focused ? "fadeIn" : "fadeOut"}
          duration={200}
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: "bold",
            color: textColor,
          }}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </Animatable.Text>
        {/* Active indicator line */}
        {focused && (
          <View 
            style={{
              position: 'absolute',
              bottom: -2,
              width: 20,
              height: 3,
              backgroundColor: isDarkMode && isRouteTab ? "#E0E0E0" : "#F02E65",
              borderRadius: 2
            }} 
          />
        )}
      </View>
    );
  } else if (name === "route") {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", width: TAB_WIDTH }}>
        <Image 
          source={icons.map} 
          style={{ 
            width: 28, 
            height: 28
          }} 
        />
        <Animatable.Text
          animation={focused ? "fadeIn" : "fadeOut"}
          duration={200}
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: "bold",
            color: textColor,
          }}
        >
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </Animatable.Text>
        {/* Active indicator line */}
        {focused && (
          <View 
            style={{
              position: 'absolute',
              bottom:-3,
              width: 20,
              height: 3,
              backgroundColor: "#F02E65",
              borderRadius: 2
            }} 
          />
        )}
      </View>
    );
  }
  
  // Fallback to Ionicons if needed (shouldn't happen with current setup)
  const activeColor = focused ? "#F02E65" : textColor;
  return (
    <Animatable.View
      animation={focused ? "bounceIn" : "fadeIn"}
      duration={300}
      style={{ alignItems: "center", justifyContent: "center", width: TAB_WIDTH }}
    >
      <Ionicons name={icon} size={24} color={activeColor} />
      <Animatable.Text
        animation={focused ? "fadeIn" : "fadeOut"}
        duration={200}
        style={{
          marginTop: 2,
          fontSize: 10,
          fontWeight: "bold",
          color: textColor,
        }}
      >
        {name.charAt(0).toUpperCase() + name.slice(1)}
      </Animatable.Text>
      {/* Active indicator line */}
      {focused && (
        <View 
          style={{
            position: 'absolute',
            bottom: -10,
            width: 20,
            height: 3,
            backgroundColor: isDarkMode && isRouteTab ? "#E0E0E0" : "#F02E65",
            borderRadius: 2
          }} 
        />
      )}
    </Animatable.View>
  )
}

const CustomTabBar = ({ state, descriptors, navigation, isKeyboardVisible }) => {
  const heightAnim = React.useRef(new Animated.Value(60)).current
  const { isDarkMode } = useTheme()
  
  // Determine if we're on the route tab
  const isRouteTab = state.routes[state.index]?.name === "route";

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isKeyboardVisible ? 0 : 60,
      duration: 220,
      useNativeDriver: false,
    }).start()
  }, [isKeyboardVisible])

  if (isKeyboardVisible) {
    return null
  }

  return (
    <Animated.View
      style={{
        width: "100%",
        height: heightAnim,
        flexDirection: "row",
        backgroundColor: isDarkMode ? COLORS.dark.background : COLORS.light.background,
        alignItems: "center",
        justifyContent: "space-around",
        borderTopWidth:0.5,
        borderColor:"#EDEDF0"
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              android_ripple: { color: "rgba(0,0,0,0.1)", borderless: true },
            }}
          >
            {options.tabBarIcon({
              focused: isFocused,
              // Pass additional props for custom icon handling
              isDarkMode: isDarkMode,
              isRouteTab: route.name === "route" && isRouteTab
            })}
          </Pressable>
        )
      })}
    </Animated.View>
  )
}

export default function TabLayout() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const { isDarkMode } = useTheme()
  const [focusedRoute, setFocusedRoute] = useState("home") // Track focused route

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    )
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    )

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} isKeyboardVisible={isKeyboardVisible} />}
        screenOptions={({ route }) => ({
          headerShown: false,
          lazy: false,
          tabBarIcon: ({ focused }) => { // Removed color parameter since we're using custom images
            let icon

            if (route.name === "home") {
              icon = focused ? "home" : "home-outline"
            } else if (route.name === "route") {
              icon = focused ? "map-sharp" : "map-outline"
            }

            return <TabIcon 
              icon={icon} 
              name={route.name} 
              focused={focused} 
              isDarkMode={isDarkMode}
              isRouteTab={route.name === "route" && focusedRoute === "route"}
            />
          },
          
        })}
        // Track focused route
        screenListeners={{
          state: (e) => {
            const routeName = e.data.state.routes[e.data.state.index].name;
            setFocusedRoute(routeName);
          }
        }}
      >
        <Tabs.Screen options={{animation:'shift'}}  name="home" />
        <Tabs.Screen options={{animation:'shift'}} name="route" />
      </Tabs>

      <StatusBar
        style={isDarkMode ? "light" : "dark"}
        backgroundColor={isDarkMode ? COLORS.dark.background : COLORS.light.background}
        animated
      />
    </View>
  )
}
