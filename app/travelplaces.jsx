import React, { useRef,useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  Image,
  Modal
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams,router  } from 'expo-router';
import { icons } from '../constants';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = height * 0.5;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const TravelPlaceScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data } = useLocalSearchParams();
  const place = JSON.parse(data);
  place.tips=JSON.parse(place.tips)
  const goback = () => {
    router.back();
    setTimeout(() => {
      router.push({ pathname: "/route", params: { data: JSON.stringify(place) } });
    }, 100);
   }



  // Parallax and Animation Interpolations
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const openMaps = () => {
      const url = Platform.select({
        android: `https://www.google.com/maps/search/?api=1&query=${place.Lat},${place.Long}`
      });
      Linking.openURL(url).catch(err => console.error("An error occurred", err));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* <StatusBar barStyle="light-content" /> */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={{ 
            width: 120,
            height: 40,
            backgroundColor: '#fff',
            position: 'absolute',
            top: 3,
            zIndex: 1,
            alignSelf:'flex-end',
            right:10
          }}/>
          <TouchableOpacity 
            onPress={() => setModalVisible(false)} 
            style={{ position: 'absolute', top: 54, right: 12, zIndex: 2, backgroundColor:'#fff', borderRadius:30, padding:5 }}
            activeOpacity={1}
          >
            <Ionicons name="close-outline" size={34} color="black" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            {loading && (
              <View style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                zIndex: 1
              }}>
                <ActivityIndicator size="large" color="#054f99" />
              </View>
            )}
            <WebView
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              source={{ uri: place.streetView }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Modal>
      {/* Parallax Header */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_MAX_HEIGHT,
          overflow: 'hidden',
          transform: [{ translateY: headerTranslate }],
        }}
      >
        <Animated.Image
          source={{ uri: place.image }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: null,
            height: HEADER_MAX_HEIGHT,
            resizeMode: 'cover',
            transform: [{ translateY: imageTranslate }],
          }}
        />
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: 'rgba(0,0,0,0.3)',
            opacity: titleOpacity,
          }}
        >
          <Text style={{ fontSize: 24,  color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,fontFamily:'pm' }}>{place.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:'space-between' }}>
          <Text style={{ fontSize: 18, color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{place.location}</Text>
         
          
          </View>
          <Text style={{ fontSize: 14, color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,fontFamily:'pm' }}>@{place.ISource}</Text>
          <Text></Text>
        </Animated.View>
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity style={{ position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20, left: 20, zIndex: 1 }}>
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 250, 250, 0.97)', alignItems: 'center', justifyContent: 'center',top:20 }}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Main Content */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Location Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, color: '#1a1a1a', marginBottom: 8,fontFamily:'pm' }}>{place.name}</Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
              onPress={openMaps}
            >
              <Image source={icons.googlemaps}  
              style={{width:30,height:30}}
              resizeMode='contain'
             />
              <Text style={{ fontSize: 16, color: '#666', marginLeft: 2 }}>{place.location}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8,left:4 }}
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome5 name="street-view" size={24} color="black" />
              <Text style={{ fontSize: 16, color: '#666', marginLeft: 2,top:3 }}>Google Street View</Text>
            </TouchableOpacity>
            
          </View>
          
          <TouchableOpacity
          style={{position: 'absolute', right: 30, top: 65, alignItems:'center', padding:10,borderWidth:1,borderRadius:10}}
          onPress={goback}
          >
          <MaterialIcons name="directions" size={34} color="black" />
          <Text style={{fontFamily:'Outfit-Medium'}}>
            Directions
          </Text>
          </TouchableOpacity>
         

          {/* About */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>About</Text>
            <Text style={{ fontSize: 16, lineHeight: 24, color: '#666' }}>{place.about}</Text>
          </View>

          {/* Best Time to Visit */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>Best Time to Visit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={{ fontSize: 16, color: '#666', marginLeft: 8 }}>{place.bestTimeToVisit}</Text>
            </View>
          </View>

          {/* Visitor Tips */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>Visitor Tips</Text>
            {place.tips.map((tip, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={{ fontSize: 16, color: '#666', marginLeft: 8, flex: 1 }}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default TravelPlaceScreen;