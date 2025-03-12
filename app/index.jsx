import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ImageBackground, Image, TouchableOpacity } from 'react-native';

import { images, icons } from "../constants"
const { width, height } = Dimensions.get('window');
import { Redirect,router } from "expo-router";
import { useGlobalContext } from "../context/GlobalProvider";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";

export default function Main() {
  const { loading, isLogged } = useGlobalContext();

  if (!loading && isLogged) return <Redirect href="/home" />;


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
          disabled={loading}
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
          {!loading ? (
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