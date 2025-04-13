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
            backgroundColor: 'rgba(255, 255, 255, 1)', // white with full opacity
            borderBottomWidth: 3,
            borderTopWidth: 1.8,
            borderLeftWidth: 1.8,
            borderRightWidth: 3,
            borderBottomColor: 'rgb(23, 22, 22)', // black with full opacity
            borderTopColor: 'rgb(100, 100, 100)', // black with full opacity
            borderLeftColor: 'rgb(100, 100, 100)', // black with full opacity
            borderRightColor: 'rgba(0, 0, 0, 1)', // black with full opacity
            borderRadius: 10, // sharp edges
            padding: 12,
            margin: 10,
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'rgba(255, 0, 127, 1)', // pink with full opacity
            fontSize: 16,
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