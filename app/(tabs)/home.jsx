import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, FlatList, Dimensions, Easing, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from "../../context/ThemeProvider";
import { COLORS } from "../../constants/theme";
import { Loader, ThemeToggleButton } from "../../components";
import { icons } from '../../constants';
import HistoryPicker from '../../components/HomeComponents/HistoryPicker';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Places from '../../components/HomeComponents/RecentPlaces';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import TourismPlaces from '../../components/HomeComponents/TourismPlaces';
import Lifestyle from '../../components/HomeComponents/Lifestyle';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import { getAdvertisements, getvisitingPlaces } from '../../lib/appwrite';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Home = () => {
  const { isDarkMode } = useTheme();
  const { user } = useGlobalContext();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const { historyPlaces, recentPlaces } = useGlobalContext();
  const [advertisements, setAdvertisements] = useState([]);
  const [visitingPlaces, setVisitingPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sidebar setup - 80% of screen width
  const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Start with sidebar off-screen (to the right)
  const sidebarPosition = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  
  // Use actual places without fallback values
  const history = historyPlaces;
  const recent = recentPlaces;
  
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
  
  const fetchAdvertisements = async () => {
    try {
      const response = await getAdvertisements(user.District);
      setAdvertisements(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      setLoading(false);
    }
  };
  
  const fetchVisitingPlaces = async () => {
    try {
      const response = await getvisitingPlaces(user.District);
      setVisitingPlaces(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visiting places:", error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.District) {
      fetchAdvertisements();
      fetchVisitingPlaces();
    }
  }, [user?.District]);
  
  const healthcare=[
    {name:'Hospital',street:'59th St to 110th St',latitude:40.785091,longitude:-73.968285},
    {name:'Clinic',street:'Manhattan, NY 10036',latitude:40.758896,longitude:-73.985130},
    {name:'Pharmacy',street:'New York, NY 10038',latitude:40.706086,longitude:-73.996684}
  ]
  
  
  const router = useRouter();
  
  const handlePlaceSelect = (place) => {
    // Navigate to the route screen with the selected place data
    // Ensure the place data structure matches what the route screen expects
    const formattedPlace = {
      name: place.name || place.Name,
      street: place.street || '',
      Lat: place.Lat || place.Latitude,
      Long: place.Long || place.Longitude,
      District: place.District || place.district || ''
    };
    
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/route',
        params: { data: JSON.stringify(formattedPlace) }
      });
    }, 100);
  };
  
  const handleSearchPress = () => {
    // Navigate to the route screen with search parameter
    router.push({
      pathname: '/(tabs)/route',
      params: { search: 'true' }
    });
  };
  
  const CustomTrigger = ({ isVisible, setIsVisible, selectedItem, placeholder }) => (
    <TouchableOpacity
      onPress={() => setIsVisible(true)}
      style={{
        backgroundColor: isDarkMode ? COLORS.dark.picker : COLORS.light.picker,
        height:35,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 90, 
      }}
    >
      <FontAwesome5 name="history" size={18} color={(isDarkMode ? COLORS.dark.background : COLORS.dark.background)} style={{marginRight: 5}} />
      <Text style={{ 
        color:  (isDarkMode ? COLORS.dark.background : COLORS.dark.background),
        fontSize: 15,
        fontFamily: 'Outfit-Regular',
      }}>
        { placeholder}
      </Text>
      
    </TouchableOpacity>
  );

  
  return (
   <SafeAreaView style={{
    height:'100%',
    backgroundColor: isDarkMode ? COLORS.dark.background : COLORS.light.background
   }}>
    <View
       style={{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingHorizontal:15,
        paddingtop:5
       }}
      > 
      <View
      style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}
      >
        <Text style={{fontSize:26,fontFamily:'KodeMono-Bold',color: isDarkMode ? COLORS.dark.text : COLORS.light.text}}>TravX</Text>
        <ThemeToggleButton/>
        </View>
        <TouchableOpacity onPress={toggleSidebar}>
          <Image source={!isDarkMode ? icons.darkBurger : icons.lightBurger} style={{
            width:20,
            height:20,
            padding:10
          }}
          resizeMode='contain'
          />
        </TouchableOpacity>
      
      </View>
    <ScrollView
    style={{
      height:'100%',
    }}
    >
    <View
     style={{
      paddingHorizontal:15,
      paddingtop:5
     }}
    >
      <View
        style={{
          width:'100%',
          backgroundColor: isDarkMode ? COLORS.dark.input : COLORS.light.input,
          height:50,
          borderRadius:16,
          marginTop:5,
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'space-between',
          paddingHorizontal:12
        }}
      >
        <TouchableOpacity 
        style={{flexDirection:'row', alignItems:'center', flex: 1}}
        onPress={handleSearchPress}
        >
        <Image source={isDarkMode ? icons.searchLight : icons.searchDark} style={{
          width:20,
          height:20,
        }}
        resizeMode='contain'
        />
        <Text style={{fontSize:18,color: isDarkMode ? '#8F8F8F' : "#3B3B3B",fontFamily:'Outfit-Regular',marginLeft:10}}>Where To?</Text>
        </TouchableOpacity>
        
        {history.length > 0 && (
          <HistoryPicker 
          data={history} 
          onSelect={handlePlaceSelect} 
          placeholder="History"
          title="Pick a Place"
          TriggerComponent={CustomTrigger}
          isDarkMode={isDarkMode}
        />
        )}
      </View>
      {recent.length > 0 && (
        <>
          <Text style={{fontSize:16,color: isDarkMode ? COLORS.dark.text : COLORS.light.text,fontFamily:'Outfit-Medium',marginTop:10,marginBottom:10}}>Recent</Text>
          {recent.map((place, index) => (
            <Places
              isDarkMode={isDarkMode}
              key={index}
              place={place}
              icon={<MaterialIcons name="location-on" size={34} color={isDarkMode ? "#9C9C9C" : "#1C1C1C"} />}
              item={place}
              COLORS={COLORS}
              onPress={handlePlaceSelect}
            />
          ))}
        </>
      )}
    </View>
    <View
    style={{
      paddingLeft:12,
      
    }}
    >
       <Text style={{fontSize:18,color: isDarkMode ? COLORS.dark.text : COLORS.light.text,fontFamily:'Outfit-Medium',marginTop:5,marginBottom:2}}>Reccomendations</Text>
       
       
       
       <Text style={{fontSize:16,color: isDarkMode ? COLORS.dark.text : COLORS.light.text,fontFamily:'Outfit-Medium',marginTop:5,marginBottom:10}}>Tourism</Text>
       <FlatList
         data={visitingPlaces}
         horizontal
         showsHorizontalScrollIndicator={false}
         renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/travelplaces",
                params: { data: JSON.stringify(item) },
              })
            }
          >
           <TourismPlaces
             key={index}
             item={item}
             isDarkMode={isDarkMode}
             COLORS={COLORS}
           /></TouchableOpacity>
         )}
         keyExtractor={(item, index) => index.toString()}
       />
       <Text style={{fontSize:16,color: isDarkMode ? COLORS.dark.text : COLORS.light.text,fontFamily:'Outfit-Medium',marginTop:10,marginBottom:10}}>HealthCares</Text>
       <FlatList
         data={healthcare}
         horizontal
         showsHorizontalScrollIndicator={false}
         renderItem={({ item, index }) => (
           <Lifestyle
             key={index}
             item={item}
             isDarkMode={isDarkMode}
             COLORS={COLORS}
             icon={<FontAwesome5 name="hospital-symbol" size={24} color={isDarkMode ? "#9C9C9C" : "#1C1C1C"} />}
           />
         )}
         keyExtractor={(item, index) => index.toString()}
       />
       <Text style={{fontSize:16,color: isDarkMode ? COLORS.dark.text : COLORS.light.text,fontFamily:'Outfit-Medium',marginTop:10,marginBottom:10}}>Foods</Text>
       <FlatList
         data={advertisements}
         horizontal
         showsHorizontalScrollIndicator={false}
         renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/advertisement",
                params: { data: JSON.stringify(item) },
              })
            }
          >
           <Lifestyle 
             key={index}
             item={item}
             isDarkMode={isDarkMode}
             COLORS={COLORS}
             icon={<Ionicons name="fast-food" size={24} color={isDarkMode ? "#9C9C9C" : "#1C1C1C"} />}
           />
          </TouchableOpacity>
         )}
         keyExtractor={(item, index) => index.toString()}
       />
       
    </View>
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

      {/* Sidebar - 80% of screen width */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: SIDEBAR_WIDTH, // Exactly 80% of screen width
          height: "107%",
          backgroundColor: isDarkMode ? COLORS.dark.input : COLORS.light.input,
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
                <Ionicons name="close" size={24} color={isDarkMode ? "#000" : "#000"} />
              </TouchableOpacity>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: isDarkMode ? COLORS.dark.text : COLORS.light.text }}>Menu</Text>
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
                <Text style={{ fontSize: 18, fontWeight: "bold", color: isDarkMode ? COLORS.dark.text : COLORS.light.text }}>
                  {user?.username || "User"}
                </Text>
                <Text style={{ color: isDarkMode ? "#ccc" : "#666" }}>
                  {user?.District || "user@example.com"}
                </Text>
              </View>
            </View>

           
          </View>
        </SafeAreaView>
      </Animated.View>
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  customItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customItemStreet: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default Home