import React, { useState, useRef, useEffect,useMemo,useCallback  } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, StyleSheet, Linking , Modal, FlatList, Animated, Easing, BackHandler, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker, Circle } from 'react-native-maps';
import { Ionicons, Entypo, FontAwesome, MaterialIcons, AntDesign, FontAwesome6, Octicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { icons } from '../../constants';
import RouteDisplay from '../../components/RouteDisplay';
import { useGlobalContext } from "../../context/GlobalProvider";
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { findTop3DistinctRoutes, fetchAndSeparatePaths, merge, combination, polylinemaker, fetchLocationDetails, findBestMatch, fetchSuggestions, fetchSearchSuggestions,findClosestLocation } from "../../lib/pathfinder";
import Direction from '../../components/Direction';
import SearchModal from '../../components/SearchModal';
import BottomSheet from '../../components/BottomSheet';
const { width, height } = Dimensions.get('window');
import {getPlaceDetails} from "../../lib/appwrite";
import { useLocalSearchParams,useFocusEffect  } from 'expo-router';

const customMapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#72ddf7" }
    ]
  },
];

export default function Main() {
  const { data } = useLocalSearchParams();
  let place = useMemo(() => (data ? JSON.parse(data) : null), [data]);
  const hasUpdated = useRef(false);


  
  useFocusEffect(
    useCallback(() => {
      if (place) {
        setState(prevState => ({
          ...prevState, 
          isBottomSheetVisible: true,
          SearchLocationCords: [place.Lat, place.Long],
          showSearchMarker: true,
          searchPlace: {
            Name: place.name,
            District: place.location,
            Latitude: place.Lat,
            Longitude: place.Long,
          },
          placeend: [],
          placeStart: [],
          placeSearchOn: false,
          searchText: place.name,
        }));
  
        mapRef.current?.animateCamera(
          {
            center: {
              latitude: place.Lat,
              longitude: place.Long,
            },
            pitch: 0,
            heading: 0,
            zoom: 15,
          },
          { duration: 500 }
        );
      }
    }, [place])
  );
  
  const { user } = useGlobalContext();
  const db = useSQLiteContext();
  const [state, setState] = useState({
    routeData: [],
    selectedRouteIndex: 0,
    to: "",
    from: "",
    polylines: [],
    isSidebarOpen: false,
    mapType: 'standard',
    showPath: false,
    location: null,
    heading: null,
    searchText: "",
    showSearchMarker: false,
    SearchLocationCords: [],
    isMarkerVisible: false,
    showMainSearch: false,
    polyliner: [],
    isdirectionVisible: false,
    clicked: false,
    resultsFrom: [],
    resultsTo: [],
    resultsSearch: [],
    roadDistance: [],
    currentDistance: null,
    track: false,
    isSearchModalVisible: false,
    searchPlace:[],
    isBottomSheetVisible: false,
    placeSearchOn:false,
    placeStart:[],
    placeend:[],
    dirLoad:false
    
  });

  const mapRef = useRef(null);
  const sidebarAnimation = useRef(new Animated.Value(-width)).current;

  const sidebarStyle = {
    transform: [{ translateX: sidebarAnimation }],
  };


  

  const toggleSidebar = () => {
    const newValue = state.isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnimation, {
      toValue: newValue,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    setState(prevState => ({ ...prevState, isSidebarOpen: !prevState.isSidebarOpen }));
  };

  const handleRouteSelect = (index) => {
    const selectedDistance = state.roadDistance[index];
    setState(prevState => ({
      ...prevState,
      currentDistance: selectedDistance,
      selectedRouteIndex: index,
      polyliner: state.polylines[index],
    }));
  };

  const handleSearchPress = async () => {
    if (state.from === "" || state.to === "" || state.from === state.to) {
      return;
    }
    await getBestRoutewithNodes(state.from, state.to);

    
  };

  const placeSearch = async (search) => {
    if (!search.trim()) return;

    const bestMatch = await findBestMatch(search);

    if (bestMatch) {
      const fullResult = await fetchLocationDetails(bestMatch);

      if (fullResult.length > 0 ) {
        const location = [fullResult[0].Latitude,fullResult[0].Longitude]
        setState(prevState => ({
          ...prevState,
          to: fullResult[0].Name,
          searchText: fullResult[0].Name,
          resultsTo: [],
          showSearchMarker: true,
          showMainSearch: false,
          SearchLocationCords: location
        }));
        console.log(SearchLocationCords);

        mapRef.current?.animateCamera(
          {
            center: { latitude: fullResult[0].Latitude, longitude: fullResult[0].Longitude },
            pitch: 0,
            heading: 0,
            zoom: 15,
          },
          { duration: 500 }
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No coordinates found for the location'
        });
      }
    } else {
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'No locations found'
      });
    }
  };

  const handleLayersPress = async() => {
    setState(prevState => ({
      ...prevState,
      mapType: prevState.mapType === 'standard' ? 'hybrid' : 'standard'
    }));
   
  };

  const handleSearchViewOpen = () => {
    setState(prevState => ({
      ...prevState,
      isdirectionVisible: true
    }));
  };

  const fetchSuggestionsFrom = async (input) => {
    if (input.trim() === '') {
      setState(prevState => ({
        ...prevState,
        resultsFrom: []
      }));
      return;
    }
    try {
      const result = await fetchSuggestions('from', input);
      setState(prevState => ({
        ...prevState,
        resultsFrom: result
      }));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const fetchSuggestionsTo = async (input) => {
    if (input.trim() === '') {
      setState(prevState => ({
        ...prevState,
        resultsTo: []
      }));
      return;
    }

    try {
      const result = await fetchSuggestions('to', input);
      setState(prevState => ({
        ...prevState,
        resultsTo: result
      }));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const fetchSuggestionsSearch = async (input) => {
    if (input.trim() === '') {
      setState(prevState => ({
        ...prevState,
        resultsSearch: []
      }));
      return;
    }

    try {
      const result = await fetchSearchSuggestions(input);
      setState(prevState => ({
        ...prevState,
        resultsSearch: result
      }));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const getBestRoutewithNodes = async (From, To) => {
    try {
      let bestRoute = await findTop3DistinctRoutes(From, To);
      let data = [];
      let newPolylines = [];
      for (const doc of bestRoute) {
        if (!doc.path) {
          console.error("Invalid path in bestRoute document:", doc);
          continue;
        }
        state.roadDistance.push(doc.totalDistance);
        let separate = await fetchAndSeparatePaths(doc.path);
        let merged = await merge(separate);
        let res = await combination(separate, merged, From, To);
        
        data.push(res);
        let polylineData = await polylinemaker(doc.path);
        newPolylines.push(polylineData);
      }
      setState(prevState => ({
        ...prevState,
        routeData: data,
        polylines: newPolylines,
        polyliner: newPolylines[0],
        searchText: "",
        SearchLocationCords: [],
        showSearchMarker: false,
        currentDistance: state.roadDistance[0]
      }));
      setState(prevState => ({
        ...prevState,
        clicked: true,
        showPath: true,
        isSidebarOpen: true,
        isdirectionVisible: false,
        isplaceSearchOn:false
      }));
      toggleSidebar();

    } catch (error) {
      console.error("Error in getBestRoutewithNodes:", error);
    }
  };

  const locateCurrentPosition = async () => {
    setState(prevState => ({
      ...prevState,
      track: !prevState.track
    }));
    if (!state.track) {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (headingSubscription) {
        headingSubscription.remove();
      }
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setState(prevState => ({
      ...prevState,
      location: location
    }));

    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.00001,
      longitudeDelta: 0.00435,
    }, 500);

    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 0.301,
        distanceInterval: 0.4,
      },
      (newLocation) => {
        setState(prevState => ({
          ...prevState,
          location: newLocation
        }));
      }
    );

    const headingSubscription = await Location.watchHeadingAsync((newHeading) => {
      setState(prevState => ({
        ...prevState,
        heading: newHeading.trueHeading
      }));
    });

    return () => {
      locationSubscription.remove();
      headingSubscription.remove();
    };
  };
 const closeandclear = () => {
    setState(prevState => ({ ...prevState, isBottomSheetVisible: false,
      searchText: "",
      SearchLocationCords: [],
      showSearchMarker: false,
      showMainSearch: false,
      searchPlace:[],
      placeStart:[],
      placeend:[],
      selectedRouteIndex:0,
      place:null
      

     }));
 }
  useEffect(() => {
    if(state.SearchLocationCords.length > 0){
      setState(prevState => ({
        ...prevState,
        showPath: false,
        polyliner: [],
        polylines:[],
        routeData:[],
        clicked:false
      }));
    }
  }, [state.SearchLocationCords]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.isdirectionVisible || state.isSearchModalVisible) {
        setState(prevState => ({
          ...prevState,
          isdirectionVisible: false,
          isSearchModalVisible: false
        }));
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [state.isdirectionVisible, state.isSearchModalVisible]);
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // Distance in kilometers
  };
  
  const getBestRoutewithSearch = async (From, To,slat,slong,ulat,ulong) => {
    try {
      let bestRoute = await findTop3DistinctRoutes(From, To);
      let data = [];
      let newPolylines = [];
      for (const doc of bestRoute) {
        if (!doc.path) {
          console.error("Invalid path in bestRoute document:", doc);
          continue;
        }
        state.roadDistance.push(doc.totalDistance);
        let separate = await fetchAndSeparatePaths(doc.path);
        let merged = await merge(separate);
        let res = await combination(separate, merged, From, To);
        let polylineData = await polylinemaker(doc.path);
        state.placeStart.push([ulat, ulong]);
        state.placeStart.push([polylineData[0][1], polylineData[0][0]]);
        state.placeend.push([polylineData[polylineData.length-1][1], polylineData[polylineData.length-1][0]]);
        state.placeend.push([slat, slong]);
        newPolylines.push(polylineData);
        const distance = calculateDistance(ulat, ulong, polylineData[0][1], polylineData[0][0]);
        const n={"From": "Your Location", "To": doc.path[0], "Vehicle": "Walk", "distance": distance, "fare": 0, "used": false}
        const distance2 = calculateDistance(polylineData[polylineData.length-1][1], polylineData[polylineData.length-1][0], slat, slong);
        let n2;
        if (doc.path[doc.path.length-1] !== state?.searchText) {
          n2 = {"From": doc.path[doc.path.length-1], "To": state?.searchText, "Vehicle": "Walk", "distance": distance2, "fare": 0, "used": false};
        }
        res.forEach((route) => {
          route.unshift(n);
          if (n2) {
            route.push(n2);
          }
        });
        
        data.push(res);

      }
      setState(prevState => ({
        ...prevState,
        routeData: data,
        polylines: newPolylines,
        polyliner: newPolylines[0],
        searchText: "",
        SearchLocationCords: [],
        showSearchMarker: false,
        currentDistance: state.roadDistance[0],
        clicked: true,
        showPath: true,
        isSidebarOpen: true,
        isdirectionVisible: false,
        placeSearchOn:true
      }));
      toggleSidebar();

    } catch (error) {
      console.error("Error in getBestRoutewithNodes:", error);
    }
  };
 const fetchdirectiontosearch=async(lat,long)=>{
      setState(prevState => ({ ...prevState, dirLoad: true }));
  
      const directionTo=await findClosestLocation(lat,long);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted');
        return ;
      }
      
      const currentLocation = await Location.getCurrentPositionAsync({});
      const userPos = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      };
      const directionFrom = await findClosestLocation(userPos.latitude, userPos.longitude);
      if (!directionFrom || !directionTo) {
        Toast.show({
          type: 'error',
          text1: 'Error fetching directions',
        });
        return null;
      }
      await getBestRoutewithSearch(directionFrom, directionTo,lat,long,userPos.latitude,userPos.longitude);
      setState(prevState => ({
        ...prevState,
        isBottomSheetVisible: false,
        searchPlace:[],
        SearchLocationCords:[],
        dirLoad: false
      }));

 }
 const generateArcPath = (start, end, steps = 50) => {
  if (!Array.isArray(start) || !Array.isArray(end) || start.length < 2 || end.length < 2) {
    console.warn("Invalid coordinates:", start, end);
    return [];
  }

  const [lat1, lon1] = start; 
  const [lat2, lon2] = end;

  // Calculate distance (approximate)
  const distance = Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);

  // Dynamically adjust arc height & steps
  const arcHeight = Math.min(distance * 0.3, 0.002); // Max height of 0.002 degrees
  const dynamicSteps = Math.max(Math.floor(distance * 5000), 20); // More points for long distances

  let curvePoints = [];

  for (let i = 0; i <= dynamicSteps; i++) {
    const t = i / dynamicSteps;
    const lat = (1 - t) * lat1 + t * lat2;
    const lon = (1 - t) * lon1 + t * lon2;

    // Arc effect (adjusted for short distances)
    const arcOffset = Math.sin(t * Math.PI) * arcHeight;
    curvePoints.push([lat + arcOffset, lon]);
  }

  // Convert `[lat, lon]` to `{ latitude, longitude }`
  return curvePoints.map(([latitude, longitude]) => ({ latitude, longitude }));
};
 const getLongPressPlace=async(lat ,long)=>{
  setState(prevState => ({ ...prevState, 
    isBottomSheetVisible: true,
    SearchLocationCords: [lat, long],
    showSearchMarker:true
   }));
     const res= await getPlaceDetails(lat, long);
    const r1={
      "Name": res.display_name,
      "District": res.address.state_district,
      "Latitude": JSON.parse(res.lat),
      "Longitude": JSON.parse(res.lon),
    }
     setState(prevState => ({ ...prevState, searchPlace: r1 }));
     mapRef.current?.animateCamera(
       {
         center: {
           latitude: JSON.parse(res.lat),
           longitude: JSON.parse(res.lon),
         },
         pitch: 0,
         heading: 0,
         zoom: 15,
       },
       { duration: 500 },
     );
     setState(prevState => ({ ...prevState,
      
       placeend:[],
       placeStart:[],
       placeSearchOn:false,
       setSearchText: res.display_name,
      }));
 }
  return (
    <View style={{ flex: 1, marginBottom: 0, backgroundColor: '#EDEDF0' }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ ...StyleSheet.absoluteFillObject }}
        customMapStyle={customMapStyle}
        mapType={state.mapType}
        showsCompass={true}
        showsTraffic={true}
        showsBuildings={false}
        followsUserLocation={true}
        onLongPress={(e) => {
          getLongPressPlace(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
        }}
        initialRegion={{
          latitude: user.Lat,
          longitude: user.Long,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {state.showPath && state.polyliner && (
          <>
            <Polyline
              coordinates={state.polyliner.map(([longitude, latitude]) => ({
                latitude,
                longitude,
              }))}
              strokeColor="#030370"
              strokeWidth={14}
            />
            
            <Polyline
              coordinates={state.polyliner.map(([longitude, latitude]) => ({
                latitude,
                longitude,
              }))}
              strokeColor="#0000FF"
              strokeWidth={10}
            />
          </>
        )}
        {state.placeSearchOn && (
              <>
                <Polyline
                  coordinates={generateArcPath(state.placeStart[0], state.placeStart[state.placeStart.length - 1])}
                  strokeColor={state.mapType === 'hybrid' ? '#0000FF' : 'rgb(104, 107, 107)'}
                  strokeWidth={7}
                  lineDashPattern={[5, 5]} // Dotted effect
                  tappable={true}
                  onPress={() => {
                    const [startLat, startLong] = state.placeStart[0]; // First coordinate [lat, long]
                    const [endLat, endLong] = state.placeStart[state.placeStart.length - 1]; // Last coordinate [lat, long]

                    const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLong}&destination=${endLat},${endLong}&travelmode=walking`;

                    Linking.openURL(url).catch((err) => console.error("Failed to open Google Maps", err));
                  }}
                />
                <Polyline
                  coordinates={generateArcPath(state.placeend[0], state.placeend[state.placeend.length - 1])}
                  strokeColor={state.mapType === 'hybrid' ? '#0000FF' : 'rgb(99, 101, 101)'}
                  strokeWidth={7}
                  lineDashPattern={[5, 5]} // Dotted effect
                  onPress={() => {
                    const start = state.placeend[0]; // First coordinate [lat, long]
                    const end = state.placeend[state.placeend.length - 1]; // Last coordinate [lat, long]
                
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&travelmode=walking`;
                
                    Linking.openURL(url).catch((err) => console.error("Failed to open Google Maps", err));
                  }}
                  tappable={true}
                />
              </>
            )}
        {state.showPath && state.polyliner.length > 0 && !state.placeSearchOn&&(
          <Marker
            coordinate={{
              latitude: state.polyliner[state.polyliner.length - 1][1],
              longitude: state.polyliner[state.polyliner.length - 1][0],
            }}
            title={state.to}
          />
        )}
        {state.showPath && state.polyliner.length > 0 && state.placeSearchOn&&(
          <Marker
          coordinate={{
            latitude: state.placeend[state.placeend.length - 1][0],
            longitude: state.placeend[state.placeend.length - 1][1],
          }}
            title={state.to}
          />
        )}
        {!state.showPath && state.SearchLocationCords && state.showSearchMarker && (
          <Marker
            coordinate={{
              latitude: state.SearchLocationCords[0],
              longitude: state.SearchLocationCords[1],
            }}
            title={state.searchText}
          />
        )}
        {state.location && state.track && (
          <>
            <Marker
              coordinate={{
                latitude: state.location.coords.latitude,
                longitude: state.location.coords.longitude,
              }}
              rotation={state.heading}
              anchor={{ x: 0.5, y: 0.5 }}
              calloutAnchor={{ x: 0.5, y: 0.5 }}
              flat={true}
            >
              <View style={{ justifyContent: 'center', alignItems: 'center', right: -17.3, top: 17, transform: [{ rotate: '8deg' }] }}>
                <FontAwesome6 name="circle" size={15} color="#fff" />
                <Octicons name="dot-fill" size={26} color="#0000FF" style={{ position: 'absolute', alignSelf: 'center' }} />
                <AntDesign name="caretup" size={17} color="rgb(164, 41, 109)" style={{ position: 'absolute', alignSelf: 'center', transform: [{ rotate: '25deg' }], bottom: 12, right: -5 }} />
              </View>
            </Marker>
            <Circle
              center={{
                latitude: state.location.coords.latitude,
                longitude: state.location.coords.longitude,
              }}
              radius={10}
              fillColor="rgba(12, 150, 242, 0.5)"
              strokeColor="rgba(39, 100, 198, 0.86)"
              strokeWidth={1}
              zIndex={1000}
            />
          </>
        )}
    
      </MapView>
      
      <View style={{ position: 'absolute', top: 40, left: 10, right: 10, height: 50, backgroundColor: '#c1d3fe', borderRadius: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, elevation: 5 }}>
        {state.clicked && (
          <TouchableOpacity onPress={toggleSidebar} style={{ padding: 5 }}>
            <Ionicons name="menu" size={24} color="black" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{ flex: 1, height: 40, marginLeft: 10, fontSize: 16, justifyContent: 'center' }}
          onPress={() => {
            setState(prevState => ({
              ...prevState, 
              isSearchModalVisible: true, 
              isBottomSheetVisible: false,
              

            }));
          }}
        >
          {state.searchText.length > 0 ? <Text style={{ color: '#000' }}>{state.searchText}</Text> : <Text style={{ color: '#000' }}>Search here</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setState(prevState => ({ ...prevState, isSearchModalVisible: true })) }} style={{ padding: 5 }}>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleLayersPress} style={{ position: 'absolute', top: 100, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5 }}>
        <Ionicons name="layers" size={24} color="#5DB996" />
      </TouchableOpacity>
      <View style={{ position: 'absolute', top: 150, right: 10, flexDirection: 'column', alignItems: 'center' }}>
        {state.polylines.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleRouteSelect(index)}
            style={{ backgroundColor: state.selectedRouteIndex === index ? '#4169E1' : 'white', borderRadius: 20, width: 40, height: 40, elevation: 5, marginBottom: 10, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, color: state.selectedRouteIndex === index ? 'white' : 'black', alignSelf: 'center' }}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={locateCurrentPosition} style={{ position: 'absolute', bottom: 100, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5 }}>
        <Ionicons name="locate" size={24} color="black" />
      </TouchableOpacity>
      {state.routeData.length > 0 && (<TouchableOpacity onPress={()=>(
        setState(prevState => ({ ...prevState, showPath: false, polyliner: [], routeData: [], clicked: false, roadDistance: [] , placeSearchOn:false,placeStart:[],placeend:[],searchPlace:[],
          polylines:[], from: "", to: ""

        }))
      )} style={{ position: 'absolute', bottom: 50, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5 }}>
        <Ionicons name="close-sharp" size={24} color="black" />
      </TouchableOpacity>)}
      <TouchableOpacity
        onPress={handleSearchViewOpen}
        style={{ position: 'absolute', bottom: 150, right: 10, backgroundColor: '#5571b5', borderRadius: 20, padding: 10, elevation: 5 }}>
        <MaterialIcons name="directions" size={24} color="white" />
      </TouchableOpacity>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: '100%', height: '120%', backgroundColor: '#c1d3fe', elevation: 10 }, sidebarStyle]}>
        <TouchableOpacity onPress={toggleSidebar} style={{ position: 'absolute', top: 40, right: 10, zIndex: 1 }}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingTop: 40, width: '100%', paddingHorizontal: 5, marginBottom: 0 }}>
          {state.routeData.length > 0 && (
            <RouteDisplay
              routes={state.routeData}
              selectedRouteIndex={state.selectedRouteIndex}
              onRouteSelect={handleRouteSelect}
              distance1={state.roadDistance}
            />)}
        </View>
      </Animated.View>
      {state.isdirectionVisible && (   
        <>
          <Direction
            from={state.from}
            setFrom={(value) => setState(prevState => ({ ...prevState, from: value }))}
            to={state.to}
            setTo={(value) => setState(prevState => ({ ...prevState, to: value }))}
            resultsFrom={state.resultsFrom}
            resultsTo={state.resultsTo}
            fetchSuggestionsFrom={fetchSuggestionsFrom}
            fetchSuggestionsTo={fetchSuggestionsTo}
            handleSearchPress={handleSearchPress}
            setResultsFrom={(value) => setState(prevState => ({ ...prevState, resultsFrom: value }))}
            setResultsTo={(value) => setState(prevState => ({ ...prevState, resultsTo: value }))}
            setSearchLocationCords={(value) => setState(prevState => ({ ...prevState, SearchLocationCords: value }))}
            mapRef={mapRef}
            onClose={() => setState(prevState => ({ ...prevState, isdirectionVisible: false }))}
          />
        </>
      )}
      {state.isSearchModalVisible && (
        <SearchModal
        searchText={state.searchText}
        setSearchText={(value) => setState(prevState => ({ ...prevState, searchText: value }))}
        setSearchLocationCords={(value) => setState(prevState => ({ ...prevState, SearchLocationCords: value }))}
        setShowSearchMarker={(value) => setState(prevState => ({ ...prevState, showSearchMarker: value }))}
        mapRef={mapRef}
        setsearchPlace={(value) => setState(prevState => ({ ...prevState, searchPlace: value, isBottomSheetVisible: true, placeend: [], placeStart: [], placeSearchOn: false }))}
        onClose={() => setState(prevState => ({ ...prevState, isSearchModalVisible: false }))}
        bbox={user.bbox}
      />
      )}
      {state.isBottomSheetVisible &&
       <BottomSheet
       setIsBottomSheetVisible={(value) => setState(prevState => ({ ...prevState, isBottomSheetVisible: value }))}
       closeandclear={closeandclear}
        >
          
          <ScrollView style={{padding: 0}}>
            <Text style={{fontFamily:'psemibold',fontSize:17,flex:1,marginBottom: 2}}>{state?.searchPlace.Name}</Text>
            <View style={{flexDirection:'row',marginBottom: 5}}>
            <Text style={{fontFamily:'pm',fontSize:15,flex:1,marginBottom: 2}}>{state?.searchPlace.District}</Text>
            <TouchableOpacity
            disabled={state.dirLoad}
            onPress={() => {
            fetchdirectiontosearch(state?.searchPlace.Latitude, state?.searchPlace.Longitude);
            }}
        style={{ backgroundColor: 'rgb(15, 169, 135)', borderRadius: 30, padding: 10, elevation: 5,width:45,flexDirection:'row', justifyContent: 'center', alignItems: 'center',right:2 }}>
          
          <MaterialIcons name="directions" size={20} color="white" />
         </TouchableOpacity>
            </View>
            <View style={{height:1,width:'100%',backgroundColor: 'rgba(165, 170, 184, 0.5)',marginBottom: 4}}/>
            
          </ScrollView>
          
        
      </BottomSheet>
       
      }
      
      <Toast />
    </View>
  );
}
