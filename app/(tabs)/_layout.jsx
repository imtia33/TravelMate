import React from 'react'
import { View, Pressable, Dimensions } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Animatable from 'react-native-animatable'
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get('window')
const PADDING = 20
const TAB_BAR_WIDTH = width - 2 * PADDING
const TAB_WIDTH = TAB_BAR_WIDTH / 2  // Only two tabs now

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <Animatable.View
      animation={focused ? 'bounceIn' : 'fadeIn'}
      duration={400}
      style={{ alignItems: 'center', justifyContent: 'center', width: TAB_WIDTH }}
    >
      <Ionicons
        name={icon}
        size={24}
        color={color}
        style={{ marginBottom: 3 }}
      />
      <Animatable.Text
        animation={focused ? 'fadeIn' : 'fadeOut'}
        duration={300}
        style={{ fontSize: 10, fontWeight: 'bold', marginTop: 2, color }}
      >
        {name.charAt(0).toUpperCase() + name.slice(1)}
      </Animatable.Text>
    </Animatable.View>
  )
}

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={{ bottom: 0, width: "100%", height: 60, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#EDEDF0' }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
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
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', android_ripple: { color: 'rgba(0, 0, 0, 0.1)', borderless: true } }}
          >
            {options.tabBarIcon({ focused: isFocused, color: isFocused ? '#F02E65' : '#19191D', size: 24 })}
          </Pressable>
        )
      })}
    </View>
  )
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName

            switch (route.name) {
              case 'home':
                iconName = focused ? 'home' : 'home-outline'
                break
              case 'route':
                iconName = focused ? 'map-sharp' : 'map-outline'
                break
              default:
                iconName = 'home'
            }

            return <TabIcon icon={iconName} color={color} name={route.name} focused={focused} />
          },
          headerShown: false,
          lazy: false
        })}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="route" />
      </Tabs>
      <StatusBar backgroundColor="" style="dark" />
    </View>
  )
}
