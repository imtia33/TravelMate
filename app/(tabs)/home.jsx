import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Easing,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalContext } from "../../context/GlobalProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAdvertisements,
  getvisitingPlaces,
  signOut,
} from "../../lib/appwrite";
import { router } from "expo-router";
import { Loader } from "../../components";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Home() {
  const { user } = useGlobalContext();

  const [advertisements, setadvertisements] = useState([]);
  const [visitingPlaces, setvisitingPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sidebar setup - 70% of screen width
  const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Start with sidebar off-screen (to the right)
  const sidebarPosition = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Toggle sidebar function
  const toggleSidebar = () => {
    Animated.timing(sidebarPosition, {
      toValue: isSidebarOpen ? SIDEBAR_WIDTH : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setSidebarOpen(!isSidebarOpen);
  };
  const logout = async () => {
    await signOut();
    router.replace("/sign-in");
  };

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
      const response = await getAdvertisements(user.District);
      setadvertisements(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      setLoading(false);
    }
  };

  const fetchvisitingPlaces = async () => {
    try {
      const response = await getvisitingPlaces(user.District);
      setvisitingPlaces(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (advertisements.length === 0) {
      fetchAdvertisements();
    }
    if (visitingPlaces.length === 0) {
      fetchvisitingPlaces();
    }
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#c1d3fe", paddingBottom: 0 }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Image
            source={{ uri: user?.avatar }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <TouchableOpacity onPress={toggleSidebar} style={{ padding: 5 }}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>Recommended</Text>
        </View>

        {loading ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View
              style={{
                width: SCREEN_WIDTH * 0.6,
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
              }}
            >
              <Loader />
            </View>
          </Animated.View>
        ) : (
          advertisements.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10, borderRadius: 15, overflow: "hidden" }}
            >
              {advertisements.map((ad, index) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/advertisement",
                      params: { data: JSON.stringify(ad) },
                    })
                  }
                  key={index}
                  style={{
                    width: SCREEN_WIDTH * 0.6,
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
                  }}
                >
                  <View style={{ backgroundColor: "#fff" }}>
                    <Image
                      source={{ uri: ad?.image }}
                      style={{
                        width: "100%",
                        height: 150,
                        resizeMode: "contain",
                        marginTop: 3,
                      }}
                    />
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                      {ad?.Name}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
                      {ad?.Location}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            Travel Places
          </Text>
        </View>

        {loading ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#fff",
                borderRadius: 15,
                overflow: "hidden",
                marginBottom: 15,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 3,
              }}
            >
              <Loader />
            </View>
          </Animated.View>
        ) : (
          <View>
            {visitingPlaces.map((place, index) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/travelplaces",
                    params: { data: JSON.stringify(place) },
                  })
                }
                key={index}
                style={{
                  flexDirection: "row",
                  backgroundColor: "#fff",
                  borderRadius: 15,
                  overflow: "hidden",
                  marginBottom: 15,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  elevation: 3,
                }}
              >
                <Image
                  source={{ uri: place.image }}
                  style={{ width: 100, height: 100, resizeMode: "cover" }}
                />
                <View style={{ flex: 1, padding: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {place.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
                    {place.location}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#000",
                      marginTop: 5,
                      fontFamily: "pbold",
                    }}
                  >
                    ⭐{place?.rating}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Semi-transparent overlay when sidebar is open */}
      {isSidebarOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleSidebar}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10,
          }}
        />
      )}

      {/* Sidebar - 70% of screen width */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: SIDEBAR_WIDTH, // Exactly 70% of screen width
          height: "107%",
          backgroundColor: "#c1d3fe",
          zIndex: 20,
          transform: [{ translateX: sidebarPosition }],
          shadowColor: "#000",
          shadowOffset: { width: -2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
          elevation: 15,
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 20, flex: 1 }}>
            {/* Header with close button on left */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 30,
              }}
            >
              <TouchableOpacity
                onPress={toggleSidebar}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={{ fontSize: 22, fontWeight: "bold" }}>Menu</Text>
            </View>

            {/* User profile section */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 30,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(0,0,0,0.1)",
              }}
            >
              <Image
                source={{ uri: user?.avatar }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
              />
              <View style={{ marginLeft: 15 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  {user?.username || "User"}
                </Text>
                <Text style={{ color: "#666" }}>
                  {user?.District || "user@example.com"}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, justifyContent: "flex-end", bottom: 30 }}>
              <TouchableOpacity
                onPress={logout}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 20,
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                  width: 180,
                  alignSelf: "flex-end",
                }}
              >
                <Ionicons name="log-out" size={24} color="red" />
                <Text
                  style={{
                    marginLeft: 15,
                    fontSize: 16,
                    fontWeight: "500",
                    color: "red",
                  }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </SafeAreaView>
  );
}
