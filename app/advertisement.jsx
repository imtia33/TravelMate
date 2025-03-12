import React,{ useRef, useEffect } from "react"
import { View, Text, ScrollView, Image ,TouchableOpacity,Linking,Animated} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams,router  } from 'expo-router'; // Import expo router
import {Ionicons} from '@expo/vector-icons';
import { icons } from "../constants";

const MenuScreen = () => {
  const { data } = useLocalSearchParams();
  const restaurantData = JSON.parse(data);
  restaurantData.Tags=JSON.parse(restaurantData.Tags)

   const goback = () => {
    router.back();
    setTimeout(() => {
      const place = {
        name: restaurantData.Name,
        location: restaurantData.Location,
        Lat: restaurantData.lat,
        Long: restaurantData.long,
      }
      router.push({ pathname: "/route", params: { data: JSON.stringify(place) } });
    }, 100);
   }

  const scrollX = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(Object.entries(restaurantData.Tags).map(() => new Animated.Value(0))).current

  useEffect(() => {
    const animations = fadeAnim.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    })

    Animated.stagger(100, animations).start()
  }, [fadeAnim])

  const renderMenuItem = (category, items, prices, icon, data, image, index) => {
    const inputRange = [-1, 0, 200 * index, 200 * (index + 2)]
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    })
    return (
      <Animated.View
        key={category}
        style={[
          {
            maxHeight: 360,
            width: 200,
            marginRight: 15,
            borderRadius: 15,
            overflow: "hidden",
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 3,
            opacity: 0.8,
            paddingBottom: 22,
          },
          {
            opacity: fadeAnim[index],
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={{ uri: data.Image || image }}
          style={{ width: "100%", height: 150, resizeMode: "cover", borderTopLeftRadius: 15, borderTopRightRadius: 15 }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, padding: 10 }}>
          <Text style={{ fontSize: icon.Size, marginLeft: 2 }}>{icon.Text}</Text>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={{ fontSize: 18,fontFamily:'pm'}}>{category}</Text>
          </View>
        </View>
        <Animated.ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 10 }}>
          {items.map((item, idx) => (
            <View key={item} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: "#444", fontFamily: "pm" }}>{item}</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: "#FD366E", marginTop: 4, fontFamily: "pm" }}>৳ </Text>
                  <Text style={{ fontSize: 14, color: "#000", marginTop: 4, fontFamily: "pm" }}>{prices[idx]}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={{ height: "100%", backgroundColor: "#c1d3fe" }}>
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',left:20,top:10 }}
          onPress={()=>router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20,  alignItems: 'center', justifyContent: 'center',left:0,top:10,alignSelf:'flex-end' }}
          onPress={goback}
        >
          <Image
           source={icons.googlemaps}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',alignSelf:'flex-end',position:'absolute',bottom:'100%',right:10 }}
          />
        </TouchableOpacity>
      <View
        style={{
          borderRadius: 0,
          padding: 16,
          marginBottom: 0,
        }}
      >
        <Image
          resizeMode="cover"
          source={{ uri: restaurantData?.image }}
          style={{
            width: "80%",
            height: 200,
            borderRadius: 100,
            marginBottom: 0,
            alignSelf: "center",
          }}
        />
      </View>
      <Text style={{ fontSize: 28, marginBottom: 8, textAlign: "center", color: "#333",fontFamily:'pbold' }}>
        {restaurantData.Name}
      </Text>
      <Text style={{ fontSize: 16, textAlign: "center", color: "#666", marginBottom: 15 ,fontFamily:'pm'}}>
        {restaurantData.Location}
      </Text>
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: "#c1d3fe", padding: 10, paddingRight: 10 }}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {Object.entries(restaurantData.Tags).map(([category, data], index) =>
          renderMenuItem(category, data.Types, data.Price, data.Icon, data, restaurantData?.image, index),
        )}
        <View style={{ width: 30, height: 0, backgroundColor: 'transparent' }}></View>
      </Animated.ScrollView>
    </SafeAreaView>
  )
};

export default MenuScreen;