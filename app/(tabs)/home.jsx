import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, Dimensions, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { images } from '../../constants';
import { useGlobalContext } from "../../context/GlobalProvider";
import { SafeAreaView } from 'react-native-safe-area-context';
import ExpandingCardSlider from '../../components/ExpandingCardSlider';
import { useSQLiteContext } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Places } from '../../lib/db';
import { getAdvertisements,getvisitingPlaces } from '../../lib/appwrite';
import { router } from 'expo-router';
import {Loader} from '../../components';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Home() {
  const { user } = useGlobalContext();
  const db = useSQLiteContext();
  const [advertisements, setadvertisements] = useState([]);
  const [visitingPlaces, setvisitingPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  

  const fetchAdvertisements = async () => {
    try {
      const response = await getAdvertisements();
      setadvertisements(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      setLoading(false);
    }
  }
  const fetchvisitingPlaces = async () => {
    try {
      const response = await getvisitingPlaces();
      setvisitingPlaces(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (advertisements.length === 0) {
      fetchAdvertisements();
    }
    if (visitingPlaces.length === 0) {
      fetchvisitingPlaces();
    }
  }, [])

  

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#c1d3fe', paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: user?.avatar }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <TouchableOpacity style={{ padding: 5 }}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Recommended</Text>
          {/* <TouchableOpacity>
            <Text style={{ color: '#3498db' }}>See All</Text>
          </TouchableOpacity> */}
        </View>
        {loading ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={{ width: SCREEN_WIDTH * 0.6, marginRight: 15, borderRadius: 15, overflow: 'hidden', backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, opacity: 0.8 }}>
              <Loader/>
            </View>
          </Animated.View>
        ) : (
          advertisements.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, borderRadius: 15, overflow: 'hidden', }}>
              {advertisements.map((ad, index) => (
                <TouchableOpacity onPress={() => router.push({ pathname: "/advertisement", params: { data: JSON.stringify(ad) } })} key={index} style={{ width: SCREEN_WIDTH * 0.6, marginRight: 15, borderRadius: 15, overflow: 'hidden', backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, opacity: 0.8 }}>
                  <View style={{ backgroundColor: '#fff' }}>
                    <Image source={{ uri: ad?.image }} style={{ width: '100%', height: 150, resizeMode: 'contain', marginTop: 3, }} />
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{ad?.Name}</Text>
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>{ad?.Location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Travel Places</Text>
          {/* <TouchableOpacity>
            <Text style={{ color: '#3498db' }}>See All</Text>
          </TouchableOpacity> */}
        </View>
        {loading ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
            <Loader/>
            </View>
          </Animated.View>
        ) : (
          <View>
            {visitingPlaces.map((place, index) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/travelplaces", params: { data: JSON.stringify(place) } })}
            key={index} style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
               <Image
               source={{ uri: place.image }}
                style={{ width: 100, height: 100, resizeMode: 'cover' }}
               />
              <View style={{ flex: 1, padding: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{place.name}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>{place.location}</Text>
                <Text style={{ fontSize: 15, color: '#000', marginTop: 5,fontFamily:'pbold' }}>⭐{place?.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}