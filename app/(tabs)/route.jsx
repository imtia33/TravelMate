import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Linking,
  Animated,
  Easing,
  BackHandler,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Polyline,
  Marker,
  Circle,
  AnimatedRegion,
} from "react-native-maps";
import {
  Ionicons,
  Entypo,
  FontAwesome,
  MaterialIcons,
  AntDesign,
  FontAwesome6,
  Octicons,
  Feather,
} from "@expo/vector-icons";
import RouteDisplay from "../../components/RouteDisplay";
import { useGlobalContext } from "../../context/GlobalProvider";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import {
  findTop3DistinctRoutes,
  fetchAndSeparatePaths,
  merge,
  combination,
  polylinemaker,
  findBestMatch,
  fetchSuggestions,
  findClosestLocation,
  findshortestPath,
  AskForLocationPermission,
} from "../../lib/pathfinder";
import Direction from "../../components/Direction";
import SearchModal from "../../components/SearchModal";
import BottomSheet from "../../components/BottomSheet";
const { width, height } = Dimensions.get("window");
import { getPlaceDetails } from "../../lib/appwrite";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import PlaceDirection from "../../components/PlaceDirection";
import { icons } from "../../constants";

export default function Main() {
  const { data } = useLocalSearchParams();
  let place = useMemo(() => (data ? JSON.parse(data) : null), [data]);

  useFocusEffect(
    useCallback(() => {
      if (place) {
        setState((prevState) => ({
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

  const [state, setState] = useState({
    routeData: [],
    selectedRouteIndex: 0,
    to: "",
    from: "",
    polylines: [],
    isSidebarOpen: false,
    mapType: "standard",
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
    searchPlace: [],
    isBottomSheetVisible: false,
    placeSearchOn: false,
    placeStart: [],
    placeend: [],
    dirLoad: false,
    dirModal: false,
    alternativeFrom: "",
    alternativeTo: "",
    alternativeButtonShow: false,
    mainpath: null,
    locationaccuracy:null,
    maprotation:false
  });
  const locationSubscription = useRef(null);
  const headingSubscription = useRef(null);

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
    setState((prevState) => ({
      ...prevState,
      isSidebarOpen: !prevState.isSidebarOpen,
    }));
  };
  const handleRouteSelect = (index) => {
    const selectedDistance = state.roadDistance[index];
    setState((prevState) => ({
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
    const bestFromMatch = await findBestMatch(state.from, user.District);

    const bestToMatch = await findBestMatch(state.to, user.District);

    if (!bestFromMatch || !bestToMatch) {
      Toast.show({
        type: "error",
        text1: "Error fetching directions.",
        text2: "See if you have entered a valid location",
      });
      return;
    }
    await getBestRoutewithNodes(bestFromMatch, bestToMatch);
    setState((prevState) => ({
      ...prevState,
      alternativeButtonShow: true,
      alternativeFrom: bestFromMatch,
      alternativeTo: bestToMatch,
    }));
  };
  const handleAlternativeCheck = async () => {
    try {
      const alternativePaths = await findTop3DistinctRoutes(
        state.alternativeFrom,
        state.alternativeTo,
        user.District
      );
      const uniquePaths = alternativePaths.filter(
        (item) => item.totalDistance !== state.mainpath
      );

      if (uniquePaths.length === 0) {
        Toast.show({
          type: "error",
          text1: "No alternative routes found",
          text2: "Sorry, this is the only route available",
        });
        setState((prevState) => ({
          ...prevState,
          alternativeFrom: "",
          alternativeTo: "",
          alternativeButtonShow: false,
          mainpath: null,
        }));
        return;
      }

      let data = [];
      let newPolylines = [];
      let updatedRoadDistance = [...state.roadDistance]; // Copy the existing road distances
      let i = 0;

      for (const doc of uniquePaths) {
        if (i === 2) break;
        if (!doc.path) {
          console.error("Invalid path in bestRoute document:", doc);
          continue;
        }

        // Add the distance of the current path to the roadDistance array
        updatedRoadDistance.push(doc.totalDistance);

        let separate = await fetchAndSeparatePaths(doc.path);
        let merged = await merge(separate);
        let res = await combination(
          separate,
          merged,
          state.alternativeFrom,
          state.alternativeTo
        );

        data.push(res);
        let polylineData = await polylinemaker(doc.path);
        newPolylines.push(polylineData);
        i++;
      }

      setState((prevState) => ({
        ...prevState,
        routeData: [...prevState.routeData, ...data],
        polylines: [...prevState.polylines, ...newPolylines],
        roadDistance: updatedRoadDistance, // Update state once after the loop
        alternativeFrom: "",
        alternativeTo: "",
        alternativeButtonShow: false,
        mainpath: null,
      }));

      toggleSidebar();
    } catch (err) {
      console.error("Error in handleAlternativeCheck:", err);
    }
  };

  const handleLayersPress = async () => {
    setState((prevState) => ({
      ...prevState,
      mapType: prevState.mapType === "standard" ? "hybrid" : "standard",
    }));
  };

  const handleSearchViewOpen = () => {
    setState((prevState) => ({
      ...prevState,
      isdirectionVisible: true,
    }));
  };

  const fetchSuggestionsFrom = async (input) => {
    if (input.trim() === "") {
      setState((prevState) => ({
        ...prevState,
        resultsFrom: [],
      }));
      return;
    }
    try {
      const result = await fetchSuggestions(user.District, input);
      setState((prevState) => ({
        ...prevState,
        resultsFrom: result,
      }));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const fetchSuggestionsTo = async (input) => {
    if (input.trim() === "") {
      setState((prevState) => ({
        ...prevState,
        resultsTo: [],
      }));
      return;
    }

    try {
      const result = await fetchSuggestions(user.District, input);
      setState((prevState) => ({
        ...prevState,
        resultsTo: result,
      }));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const getBestRoutewithNodes = async (From, To) => {
    try {
      let bestRoute = await findshortestPath(From, To, user.District);

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
      setState((prevState) => ({
        ...prevState,
        routeData: data,
        polylines: newPolylines,
        polyliner: newPolylines[0],
        searchText: "",
        SearchLocationCords: [],
        showSearchMarker: false,
        currentDistance: state.roadDistance[0],
        selectedRouteIndex: 0,
        clicked: true,
        showPath: true,
        isSidebarOpen: true,
        isdirectionVisible: false,
        isplaceSearchOn: false,
        mainpath: bestRoute[0].totalDistance,
      }));
      mapRef.current?.animateCamera({
        center: {
          latitude: newPolylines[0][0][1],
          longitude: newPolylines[0][0][0],
        },
        zoom: 14,
        tilt: 0,
        heading: 0,
      });

      toggleSidebar();
    } catch (error) {
      console.error("Error in getBestRoutewithNodes:", error);
    }
  };

  const markerCoordinate = useRef(
    new AnimatedRegion({
      latitude: 0, // Default to Dhaka
      longitude: 0,
    })
  ).current;

  const startTracking = async () => {
    let x=0;
    let firstUpdate = true;
    const res = await AskForLocationPermission();
    if (res.error !== 103) {
      Alert.alert('Error', res.message);
      return;
    }

    setState((prevState) => ({
      ...prevState,
      track: true,
      maprotation: true,
    }));

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
      },
      (newLocation) => {
        const { latitude, longitude, accuracy } = newLocation.coords;

        if (firstUpdate) {
          markerCoordinate.setValue({ latitude, longitude });
          firstUpdate = false;
        } else {
          markerCoordinate.timing({
            latitude,
            longitude,
            duration: 500,
            useNativeDriver: false, 
          }).start();
        }

        setState((prevState) => ({
          ...prevState,
          location: newLocation,
          locationaccuracy: accuracy,
        }));
        if(x===0){
        mapRef.current?.animateCamera({
          center: { latitude, longitude },
          zoom: 19,
          tilt: 0,
          heading: state.maprotation ? state.heading : 0,
        });
        x++
        }
        
      }
    );

    headingSubscription.current = await Location.watchHeadingAsync(
      (headingData) => {
        if (Math.abs(headingData.trueHeading - state.heading) > 15) {
          setState((prevState) => ({
            ...prevState,
            heading: headingData.trueHeading,
          }));
        }
      }
    );
  };


  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    if (headingSubscription.current) {
      headingSubscription.current.remove();
    }
    setState((prevState) => ({
      ...prevState,
      track: false,
      location: null,
      heading: null,
      maprotation:false
    }));
    
  };
  const closeandclear = () => {
    setState((prevState) => ({
      ...prevState,
      isBottomSheetVisible: false,
      searchText: "",
      SearchLocationCords: [],
      showSearchMarker: false,
      showMainSearch: false,
      searchPlace: [],
      placeStart: [],
      placeend: [],
      selectedRouteIndex: 0,
      place: null,
      polylines: [],
      routeData: [],
      roadDistance: [],
      currentDistance: null,
      track: false,
      isSidebarOpen: false,
      isdirectionVisible: false,
      clicked: false,
      resultsFrom: [],
      resultsTo: [],
      resultsSearch: [],
      dirLoad: false,
    }));
  };
  useEffect(() => {
    if (state.SearchLocationCords.length > 0) {
      setState((prevState) => ({
        ...prevState,
        showPath: false,
        polyliner: [],
        polylines: [],
        routeData: [],
        clicked: false,
      }));
    }
  }, [state.SearchLocationCords]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (state.isdirectionVisible || state.isSearchModalVisible) {
          setState((prevState) => ({
            ...prevState,
            isdirectionVisible: false,
            isSearchModalVisible: false,
          }));
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [state.isdirectionVisible, state.isSearchModalVisible]);
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
  };

  const getBestRoutewithSearch = async (From, To, slat, slong, ulat, ulong) => {
    try {
      console.log(From, To);
      let bestRoute = await findshortestPath(From, To);
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
        state.placeend.push([
          polylineData[polylineData.length - 1][1],
          polylineData[polylineData.length - 1][0],
        ]);
        state.placeend.push([slat, slong]);
        newPolylines.push(polylineData);
        const distance = calculateDistance(
          ulat,
          ulong,
          polylineData[0][1],
          polylineData[0][0]
        );
        const n = {
          From: "Your Location",
          To: doc.path[0],
          Vehicle: "Walk",
          distance: distance,
          fare: 0,
          used: false,
        };
        const distance2 = calculateDistance(
          polylineData[polylineData.length - 1][1],
          polylineData[polylineData.length - 1][0],
          slat,
          slong
        );
        let n2;
        if (doc.path[doc.path.length - 1] !== state?.searchText) {
          n2 = {
            From: doc.path[doc.path.length - 1],
            To: state?.searchText,
            Vehicle: "Walk",
            distance: distance2,
            fare: 0,
            used: false,
          };
        }
        res.forEach((route) => {
          route.unshift(n);
          if (n2) {
            route.push(n2);
          }
        });

        data.push(res);
      }
      setState((prevState) => ({
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
        placeSearchOn: true,
      }));
      toggleSidebar();
    } catch (error) {
      console.error("Error in getBestRoutewithNodes:", error);
    }
  };
  const fetchdirectiontosearch = async (lat, long) => {
    setState((prevState) => ({ ...prevState, dirLoad: true }));
    const res= await AskForLocationPermission();
    if(res.error !== 103) {
     Toast.show({
       type: "error",
       text1: res.message,
     });
     setState((prevState) => ({ ...prevState, dirLoad: false }));
     return;
    }
    const currentLocation = await Location.getCurrentPositionAsync({});
    if (!currentLocation) {
      Toast.show({
        type: "error",
        text1: "Please Turn on your Location",
      });
      return;
    }

    const userPos = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
    if (!userPos) {
      setState((prevState) => ({ ...prevState, dirLoad: false }));
      return;
    }
    const directionTo = await findClosestLocation(lat, long, user.District);
    const directionFrom = await findClosestLocation(
      userPos.latitude,
      userPos.longitude,
      user.District
    );
    if (!directionFrom || !directionTo) {
      Toast.show({
        type: "error",
        text1: "Error fetching directions",
      });
      return null;
    }
    await getBestRoutewithSearch(
      directionFrom,
      directionTo,
      lat,
      long,
      userPos.latitude,
      userPos.longitude
    );
    setState((prevState) => ({
      ...prevState,
      isBottomSheetVisible: false,
      searchPlace: [],
      SearchLocationCords: [],
      dirLoad: false,
    }));
  };
  const generateArcPath = (start, end, steps = 50) => {
    if (
      !Array.isArray(start) ||
      !Array.isArray(end) ||
      start.length < 2 ||
      end.length < 2
    ) {
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
    return curvePoints.map(([latitude, longitude]) => ({
      latitude,
      longitude,
    }));
  };
  const getLongPressPlace = async (lat, long) => {
    setState((prevState) => ({
      ...prevState,
      isBottomSheetVisible: true,
      SearchLocationCords: [lat, long],
      showSearchMarker: true,
    }));
    const res = await getPlaceDetails(lat, long);
    const r1 = {
      Name: res.display_name,
      District: res.address.state_district,
      Latitude: JSON.parse(res.lat),
      Longitude: JSON.parse(res.lon),
      area: res.area,
      street: res.street,
      type: res.type,
    };
    setState((prevState) => ({ ...prevState, searchPlace: r1 }));
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
      { duration: 500 }
    );
    setState((prevState) => ({
      ...prevState,

      placeend: [],
      placeStart: [],
      placeSearchOn: false,
      setSearchText: res.display_name,
    }));
  };
  return (
    <View style={{ flex: 1, marginBottom: 0, backgroundColor: "#EDEDF0" }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ ...StyleSheet.absoluteFillObject }}
        mapType={state.mapType}
        
        showsTraffic={true}
        showsBuildings={true}
        
        rotateEnabled={true}
        onLongPress={(e) => {
          getLongPressPlace(
            e.nativeEvent.coordinate.latitude,
            e.nativeEvent.coordinate.longitude
          );
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
              coordinates={generateArcPath(
                state.placeStart[0],
                state.placeStart[state.placeStart.length - 1]
              )}
              strokeColor={
                state.mapType === "hybrid" ? "#0000FF" : "rgb(104, 107, 107)"
              }
              strokeWidth={7}
              lineDashPattern={[5, 5]} // Dotted effect
              tappable={true}
              onPress={() => {
                const [startLat, startLong] = state.placeStart[0]; // First coordinate [lat, long]
                const [endLat, endLong] =
                  state.placeStart[state.placeStart.length - 1]; // Last coordinate [lat, long]

                const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLong}&destination=${endLat},${endLong}&travelmode=walking`;

                Linking.openURL(url).catch((err) =>
                  console.error("Failed to open Google Maps", err)
                );
              }}
            />
            <Polyline
              coordinates={generateArcPath(
                state.placeend[0],
                state.placeend[state.placeend.length - 1]
              )}
              strokeColor={
                state.mapType === "hybrid" ? "#0000FF" : "rgb(99, 101, 101)"
              }
              strokeWidth={7}
              lineDashPattern={[5, 5]} // Dotted effect
              onPress={() => {
                const start = state.placeend[0]; // First coordinate [lat, long]
                const end = state.placeend[state.placeend.length - 1]; // Last coordinate [lat, long]

                const url = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&travelmode=walking`;

                Linking.openURL(url).catch((err) =>
                  console.error("Failed to open Google Maps", err)
                );
              }}
              tappable={true}
            />
          </>
        )}
        {state.showPath &&
          state.polyliner.length > 0 &&
          !state.placeSearchOn && (
            <Marker
              coordinate={{
                latitude: state.polyliner[state.polyliner.length - 1][1],
                longitude: state.polyliner[state.polyliner.length - 1][0],
              }}
              title={state.to}
            />
          )}
        {state.showPath &&
          state.polyliner.length > 0 &&
          state.placeSearchOn && (
            <Marker
              coordinate={{
                latitude: state.placeend[state.placeend.length - 1][0],
                longitude: state.placeend[state.placeend.length - 1][1],
              }}
              title={state.to}
            />
          )}
        {!state.showPath &&
          state.SearchLocationCords &&
          state.showSearchMarker && (
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
         <Marker.Animated
           coordinate={markerCoordinate}
           rotation={state.heading }
           anchor={{ x: 0.5, y: 0.5 }}
           flat={true}
           image={icons.mapdir2}
         />
         <Marker.Animated
           coordinate={markerCoordinate}
           rotation={state.heading }
           anchor={{ x: 0.5, y: 0.5 }}
           flat={true}
           image={icons.mapdir}
         />
         <Circle
           center={{
             latitude: state.location.coords.latitude,
             longitude: state.location.coords.longitude,
           }}
           radius={state.locationaccuracy}
           fillColor="rgba(12, 150, 242, 0.5)"
           strokeColor="rgba(39, 100, 198, 0.86)"
           strokeWidth={1}
           zIndex={1000}
         />
       </>
        )}
      </MapView>

      <View
        style={{
          position: "absolute",
          top: 40,
          left: 10,
          right: 10,
          height: 50,
          backgroundColor: "#c1d3fe",
          borderRadius: 25,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          elevation: 5,
        }}
      >
        {state.clicked && (
          <TouchableOpacity onPress={toggleSidebar} style={{ padding: 5 }}>
            <Ionicons name="menu" size={24} color="black" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            flex: 1,
            height: 40,
            marginLeft: 10,
            fontSize: 16,
            justifyContent: "center",
          }}
          onPress={() => {
            setState((prevState) => ({
              ...prevState,
              isSearchModalVisible: true,
              isBottomSheetVisible: false,
            }));
          }}
        >
          {state.searchText.length > 0 ? (
            <Text style={{ color: "#000" }}>{state.searchText}</Text>
          ) : (
            <Text style={{ color: "#000" }}>Search here</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setState((prevState) => ({
              ...prevState,
              isSearchModalVisible: true,
            }));
          }}
          style={{ padding: 5 }}
        >
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handleLayersPress}
        style={{
          position: "absolute",
          top: 100,
          right: 10,
          backgroundColor: "white",
          borderRadius: 20,
          padding: 10,
          elevation: 5,
        }}
      >
        <Ionicons name="layers" size={24} color="#5DB996" />
      </TouchableOpacity>
      <View
        style={{
          position: "absolute",
          top: 150,
          right: 10,
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {state.polylines.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleRouteSelect(index)}
            style={{
              backgroundColor:
                state.selectedRouteIndex === index ? "#4169E1" : "white",
              borderRadius: 20,
              width: 40,
              height: 40,
              elevation: 5,
              marginBottom: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: state.selectedRouteIndex === index ? "white" : "black",
                alignSelf: "center",
              }}
            >
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
       {!state.track&&(
      <TouchableOpacity onPress={startTracking} style={{ position: 'absolute', bottom: 100, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5 }}>
      <Ionicons name="locate" size={24} color="black" />
      </TouchableOpacity>
     )}
       {state.track&&(
      <TouchableOpacity onPress={stopTracking} style={{ position: 'absolute', bottom: 100, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5 }}>
      <Ionicons name="locate" size={24} color="green" />
      </TouchableOpacity>
     )}
      {state.routeData.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            setState((prevState) => ({
              ...prevState,
              showPath: false,
              polyliner: [],
              routeData: [],
              clicked: false,
              roadDistance: [],
              placeSearchOn: false,
              placeStart: [],
              placeend: [],
              searchPlace: [],
              polylines: [],
              from: "",
              to: "",
              alternativeButtonShow: false,
              alternativeFrom: "",
              alternativeTo: "",
              mainpath: null,
            }))
          }
          style={{
            position: "absolute",
            bottom: 50,
            right: 10,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="close-sharp" size={24} color="black" />
        </TouchableOpacity>
      )}
      {state.alternativeButtonShow && (
        <TouchableOpacity
          onPress={handleAlternativeCheck}
          style={{
            position: "absolute",
            bottom: 200,
            right: 10,
            backgroundColor: "#5571b5",
            borderRadius: 20,
            padding: 10,
            elevation: 5,
          }}
        >
          <Feather name="git-pull-request" size={24} color="black" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={handleSearchViewOpen}
        style={{
          position: "absolute",
          bottom: 150,
          right: 10,
          backgroundColor: "#5571b5",
          borderRadius: 20,
          padding: 10,
          elevation: 5,
        }}
      >
        <MaterialIcons name="directions" size={24} color="white" />
      </TouchableOpacity>

      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "120%",
            backgroundColor: "#c1d3fe",
            elevation: 10,
          },
          sidebarStyle,
        ]}
      >
        <TouchableOpacity
          onPress={toggleSidebar}
          style={{ position: "absolute", top: 40, right: 10, zIndex: 1 }}
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            paddingTop: 40,
            width: "100%",
            paddingHorizontal: 5,
            marginBottom: 0,
          }}
        >
          {state.routeData.length > 0 && (
            <RouteDisplay
              routes={state.routeData}
              selectedRouteIndex={state.selectedRouteIndex}
              onRouteSelect={handleRouteSelect}
              distance1={state.roadDistance}
            />
          )}
        </View>
      </Animated.View>
      {state.isdirectionVisible && (
        <>
          <Direction
            from={state.from}
            setFrom={(value) =>
              setState((prevState) => ({ ...prevState, from: value }))
            }
            to={state.to}
            setTo={(value) =>
              setState((prevState) => ({ ...prevState, to: value }))
            }
            resultsFrom={state.resultsFrom}
            resultsTo={state.resultsTo}
            fetchSuggestionsFrom={fetchSuggestionsFrom}
            fetchSuggestionsTo={fetchSuggestionsTo}
            handleSearchPress={handleSearchPress}
            setResultsFrom={(value) =>
              setState((prevState) => ({ ...prevState, resultsFrom: value }))
            }
            setResultsTo={(value) =>
              setState((prevState) => ({ ...prevState, resultsTo: value }))
            }
            setSearchLocationCords={(value) =>
              setState((prevState) => ({
                ...prevState,
                SearchLocationCords: value,
              }))
            }
            mapRef={mapRef}
            onClose={() =>
              setState((prevState) => ({
                ...prevState,
                isdirectionVisible: false,
              }))
            }
          />
        </>
      )}
      {state.isSearchModalVisible && (
        <SearchModal
          searchText={state.searchText}
          setSearchText={(value) =>
            setState((prevState) => ({ ...prevState, searchText: value }))
          }
          setSearchLocationCords={(value) =>
            setState((prevState) => ({
              ...prevState,
              SearchLocationCords: value,
            }))
          }
          setShowSearchMarker={(value) =>
            setState((prevState) => ({ ...prevState, showSearchMarker: value }))
          }
          mapRef={mapRef}
          setsearchPlace={(value) =>
            setState((prevState) => ({
              ...prevState,
              searchPlace: value,
              isBottomSheetVisible: true,
              placeend: [],
              placeStart: [],
              placeSearchOn: false,
            }))
          }
          onClose={() =>
            setState((prevState) => ({
              ...prevState,
              isSearchModalVisible: false,
            }))
          }
          bbox={user.bbox}
        />
      )}
      {state.isBottomSheetVisible && (
        <BottomSheet
          setIsBottomSheetVisible={(value) =>
            setState((prevState) => ({
              ...prevState,
              isBottomSheetVisible: value,
            }))
          }
          closeandclear={closeandclear}
        >
          <ScrollView style={{ padding: 0 }}>
            <Text
              style={{
                fontFamily: "psemibold",
                fontSize: 17,
                flex: 1,
                marginBottom: 2,
              }}
            >
              {state?.searchPlace.Name}
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 5 }}>
              <Text
                style={{
                  fontFamily: "pm",
                  fontSize: 15,
                  flex: 1,
                  marginBottom: 2,
                }}
              >
                {state?.searchPlace.District}
              </Text>
            </View>

            <View
              style={{
                height: 1,
                width: "100%",
                backgroundColor: "rgba(165, 170, 184, 0.5)",
                marginBottom: 4,
              }}
            />
            <Text
              style={{
                fontFamily: "psemibold",
                fontSize: 17,
                flex: 1,
                marginBottom: 2,
                color: "rgba(169, 6, 87, 0.87)",
              }}
            >
              Get Direction:
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                disabled={state.dirLoad}
                onPress={() => {
                  setState((prevState) => ({ ...prevState, dirModal: true }));
                }}
                style={{
                  backgroundColor: "rgb(15, 169, 135)",
                  borderRadius: 30,
                  padding: 10,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  marginRight: 5,
                }}
              >
                <MaterialIcons name="directions" size={20} color="white" />
                <Text style={{ color: "white", marginLeft: 5 }}>
                  From A Point
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={state.dirLoad}
                onPress={() => {
                  fetchdirectiontosearch(
                    state?.searchPlace.Latitude,
                    state?.searchPlace.Longitude
                  );
                }}
                style={{
                  backgroundColor: "rgb(15, 169, 135)",
                  borderRadius: 30,
                  padding: 10,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  marginLeft: 5,
                }}
              >
                <MaterialIcons name="my-location" size={20} color="white" />
                <Text style={{ color: "white", marginLeft: 5 }}>
                  From My Location
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                backgroundColor: "white",
                padding: 5,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              {state.searchPlace?.type && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontFamily: "pb", fontSize: 17 }}>
                    Type :{" "}
                  </Text>
                  <Text style={{ fontSize: 16, fontFamily: "pm" }}>
                    {state.searchPlace.type.charAt(0).toUpperCase() +
                      state.searchPlace.type.slice(1)}
                  </Text>
                </View>
              )}
              {state.searchPlace?.area && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontFamily: "pb", fontSize: 17 }}>
                    Area :{" "}
                  </Text>
                  <Text style={{ fontSize: 17, fontFamily: "pm" }}>
                    {state.searchPlace.area}
                  </Text>
                </View>
              )}
              {state.searchPlace?.street && (
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      <Text style={{ fontFamily: "pb", fontSize: 17 }}>
                        Street :{" "}
                      </Text>
                      <Text
                        style={{
                          fontSize: 17,
                          flex: 1,
                          flexWrap: "wrap",
                          fontFamily: "pm",
                        }}
                      >
                        {state.searchPlace.street}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </BottomSheet>
      )}
      <Modal animationType="slide" transparent={true} visible={state.dirModal}>
        <PlaceDirection
          from={state.from}
          setFrom={(value) =>
            setState((prevState) => ({ ...prevState, from: value }))
          }
          resultsFrom={state.resultsFrom}
          fetchSuggestionsFrom={fetchSuggestionsFrom}
          handleSearchPress={handleSearchPress}
          setResultsFrom={(value) =>
            setState((prevState) => ({ ...prevState, resultsFrom: value }))
          }
          setSearchLocationCords={(value) =>
            setState((prevState) => ({
              ...prevState,
              SearchLocationCords: value,
            }))
          }
          mapRef={mapRef}
          onClose={() =>
            setState((prevState) => ({ ...prevState, dirModal: false }))
          }
        />
      </Modal>
      <Toast />
    </View>
  );
}
