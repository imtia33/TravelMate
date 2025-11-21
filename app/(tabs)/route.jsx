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
  UrlTile,
  
} from "react-native-maps";
import {
  Ionicons,
  MaterialIcons,
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
  generateArcPath,
  findClosestLocation,
  findshortestPath,
  AskForLocationPermission,
  fetchLocationDetails,
  calcDistance,
  checkExpandNeeded,
  fare,
} from "../../lib/pathfinder";
import Direction from "../../components/Direction";
import SearchModal from "../../components/SearchModal";
import BottomSheet from "../../components/BottomSheet";
const { width, height } = Dimensions.get("window");
import { getPlaceDetails } from "../../lib/appwrite";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import RouteBottomSheet from "../../components/RouteBottomSheet";
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
    to: null,
    from: null,
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
    isRouteBottomSheetVisible: false,
    placeSearchOn: false,
    placeStart: [],
    placeend: [],
    dirLoad: false,
    dirModal: false,
    alternativeFrom: "",
    alternativeTo: "",
    alternativeButtonShow: false,
    mainpath: null,
    locationaccuracy: null,
    maprotation: false,
    UrlTile: true,
    PlaceFrom: "",
    arc1: null,
    arc2: null,
  });
  const locationSubscription = useRef(null);
  const headingSubscription = useRef(null);

  const mapRef = useRef(null);

  const sidebarAnimation = useRef(new Animated.Value(-width)).current;

  const sidebarStyle = {
    transform: [{ translateX: sidebarAnimation }],
  };

  const getPath = async (From, To) => {
    setState((prevState) => ({ ...prevState, dirLoad: true }));
    const Start = await findClosestLocation(From.lat, From.long, user.District);
    const End = await findClosestLocation(To.lat, To.long, user.District);

    if (!Start || !End) {
      Toast.show({
        type: "error",
        text1: "Error fetching Direction",
        text2: "Sorry Direction From This point is not Available",
      });
      setState((prevState) => ({ ...prevState, dirLoad: false }));
      return;
    }
    let bestRoute = await findshortestPath(Start, End);
    let Options = await findTop3DistinctRoutes(Start, End);

    if (Options && Options.length > 0) {
      let uniquePaths = Options.filter(
        (item) => item.totalDistance !== bestRoute[0].totalDistance
      );
      bestRoute.push(...uniquePaths);
    }

    let data = [];
    let newPolylines = [];
    let roadDistance = [];
    let placeStart = [];
    let placeEnd = [];
    for (const doc of bestRoute) {
      if (!doc.path) continue;
      let polylineData = await polylinemaker(doc.path);
      let separate = await fetchAndSeparatePaths(doc.path);
      const expansionCheckEnd = await checkExpandNeeded(
        doc.path,
        {
          latitude: To.lat,
          longitude: To.long,
        },
        polylineData,
        false,
        To.Name
      );

      if (expansionCheckEnd.cut) {
        polylineData = polylineData.slice(0, expansionCheckEnd.index + 1);
        const distanceReduced = doc.totalDistance - expansionCheckEnd.cutLength;
        doc.totalDistance -= distanceReduced;
        for (let i = 0; i < separate.length; i++) {
          if (
            separate[i].From === doc.path[doc.path.length - 2] &&
            separate[i].To === doc.path[doc.path.length - 1]
          ) {
            separate[i].To = expansionCheckEnd.Name;
            separate[i].distance = separate[i].distance - distanceReduced;
            separate[i].fare = await fare(separate[i].distance, separate[i]);
          }
        }
      } else {
        polylineData.push(...expansionCheckEnd.ExtraPolyline);
        separate.push(...expansionCheckEnd.docs);
        doc.totalDistance += expansionCheckEnd.length;
      }

      const expansionCheckFront = await checkExpandNeeded(
        doc.path,
        {
          latitude: From.lat,
          longitude: From.long,
        },
        polylineData,
        true,
        From.Name
      );

      if (expansionCheckFront.cut) {
        polylineData = polylineData.slice(
          expansionCheckFront.index + 1,
          polylineData.length
        );
        const distanceReduced =
          doc.totalDistance - expansionCheckFront.cutLength;
        doc.totalDistance -= distanceReduced;
        for (let i = 0; i < separate.length; i++) {
          if (
            separate[i].From === doc.path[0] &&
            separate[i].To === doc.path[1]
          ) {
            separate[i].From = expansionCheckFront.Name;
            separate[i].distance = separate[i].distance - distanceReduced;
            separate[i].fare = await fare(separate[i].distance, separate[i]);
          }
        }
      } else {
        polylineData.unshift(...expansionCheckFront.ExtraPolyline);
        separate.unshift(...expansionCheckFront.docs);
        doc.totalDistance += expansionCheckFront.length;
      }

      let merged = await merge(separate);
      const res = await combination(
        separate,
        merged,
        expansionCheckFront.Name,
        expansionCheckEnd.Name
      );

      newPolylines.push(polylineData);
      const StartInfo = await fetchLocationDetails(Start, user.District);

      const EndInfo = await fetchLocationDetails(End, user.District);
      const DS = await calcDistance(
        From.lat,
        From.long,
        polylineData[0][1],
        polylineData[0][0]
      );
      const DE = await calcDistance(
        To.lat,
        To.long,
        polylineData[polylineData.length - 1][1],
        polylineData[polylineData.length - 1][0]
      );

      placeStart.push(
        [From.lat, From.long],
        [
          JSON.parse(StartInfo.Coordinates)[0][0],
          JSON.parse(StartInfo.Coordinates)[0][1],
        ]
      );
      placeEnd.push(
        [To.lat, To.long],
        [
          JSON.parse(EndInfo.Coordinates)[0][0],
          JSON.parse(EndInfo.Coordinates)[0][1],
        ]
      );

      const n1 = {
        From: From.Name,
        To: expansionCheckFront.Name,
        Vehicle: "Walk",
        distance: DS,
        fare: 0,
        used: false,
      };
      const n2 = {
        From: expansionCheckEnd.Name,
        To: To.Name,
        Vehicle: "Walk",
        distance: DE,
        fare: 0,
        used: false,
      };
      setState((prevState) => ({
        ...prevState,
        arc1: n1,
        arc2: n2,
      }));

      res.forEach((route) => {
        if (n1) route.unshift(n1);
        if (n2) route.push(n2);
      });

      data.push(res);
      roadDistance.push(doc.totalDistance + DS + DE);
    }

    setState((prevState) => ({
      ...prevState,
      routeData: data,
      polylines: newPolylines,
      polyliner: newPolylines[0],
      roadDistance: roadDistance,
      placeStart: placeStart,
      placeend: placeEnd,
      searchText: "",
      SearchLocationCords: [],
      showSearchMarker: false,
      currentDistance: roadDistance[0],
      clicked: true,
      showPath: true,
     // isSidebarOpen: true,
      isRouteBottomSheetVisible: true,
      isdirectionVisible: false,
      placeSearchOn: true,
      isBottomSheetVisible: false,
      searchPlace: [],
      SearchLocationCords: [],
      dirLoad: false,
      PlaceFrom: "",
    }));

   // toggleSidebar();

    mapRef.current?.animateCamera({
      center: {
        latitude: newPolylines[0][0][1],
        longitude: newPolylines[0][0][0],
      },
      zoom: 14,
      tilt: 0,
      heading: 0,
    });
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

  const markerCoordinate = useRef(
    new AnimatedRegion({
      latitude: 0, // Default to Dhaka
      longitude: 0,
    })
  ).current;

  const startTracking = async () => {
    let x = 0;
    let firstUpdate = true;
    const res = await AskForLocationPermission();
    if (res.error !== 103) {
      Alert.alert("Error", res.message);
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
          markerCoordinate
            .timing({
              latitude,
              longitude,
              duration: 500,
              useNativeDriver: false,
            })
            .start();
        }

        setState((prevState) => ({
          ...prevState,
          location: newLocation,
          locationaccuracy: accuracy,
        }));
        if (x === 0) {
          mapRef.current?.animateCamera({
            center: { latitude, longitude },
            zoom: 19,
            tilt: 0,
            heading: state.maprotation ? state.heading : 0,
          });
          x++;
        }
      }
    );

    headingSubscription.current = await Location.watchHeadingAsync(
      (headingData) => {
        setState((prevState) => ({
          ...prevState,
          heading: headingData.trueHeading,
        }));
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
      maprotation: false,
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
     // isSidebarOpen: false,
      isRouteBottomSheetVisible: false,
      isdirectionVisible: false,
      clicked: false,
      resultsFrom: [],
      resultsTo: [],
      resultsSearch: [],
      dirLoad: false,
      PlaceFrom: "",
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

  const getLongPressPlace = async (lat, long) => {
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
      isBottomSheetVisible: true,
      isRouteBottomSheetVisible:false,
      SearchLocationCords: [lat, long],
      showSearchMarker: true,
    }));
  };
  return (
    <View style={{ flex: 1, marginBottom: 0, backgroundColor: "#EDEDF0" }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ ...StyleSheet.absoluteFillObject }}
        mapType={state.UrlTile ? "none" : state.mapType}
        flipY={false}
        showsTraffic={true}
        showsBuildings={true}
        onMapReady={() => {
          setState((prevState) => ({
            ...prevState,
            UrlTile: false,
          }));
        }}
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
        {state.UrlTile && (
          <UrlTile
            urlTemplate="https://api.maptiler.com/maps/bright-v2/{z}/{x}/{y}@2x.png?key=BV79ypCzUzpvOYri324W"
            maximumZ={19}
          />
        )}
        {state.showPath && state.polyliner && (
          <>
            <Polyline
              coordinates={state.polyliner.map(([longitude, latitude]) => ({
                latitude,
                longitude,
              }))}
              strokeColor="#030370"
              strokeWidth={14}
              tappable={true}
              onPress={() => setState((prevState) => ({
                ...prevState,
                isRouteBottomSheetVisible: true,
              }))}
            />

            <Polyline
              coordinates={state.polyliner.map(([longitude, latitude]) => ({
                latitude,
                longitude,
              }))}
              strokeColor="#0000FF"
              strokeWidth={10}
              tappable={true}
              onPress={() => setState((prevState) => ({
                ...prevState,
                isRouteBottomSheetVisible: true,
              }))}
            />
          </>
        )}
        {state.placeSearchOn && (
          <>
            <Polyline
              coordinates={generateArcPath(state.placeStart[0], [
                state.polyliner[0][1],
                state.polyliner[0][0],
              ])}
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
              coordinates={generateArcPath(state.placeend[0], [
                state.polyliner[state.polyliner.length - 1][1],
                state.polyliner[state.polyliner.length - 1][0],
              ])}
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
          state.placeSearchOn && (
            <Marker
              coordinate={{
                latitude: state.placeend[0][0],
                longitude: state.placeend[0][1],
              }}
              title={state.to ? state.to.Name : ""}
              draggable={true}
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setState((prevState) => ({
                  ...prevState,
                  placeend: [[latitude, longitude]],
                }));
              }}
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
              rotation={state.heading}
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
              fillColor="rgba(50, 141, 202, 0.23)"
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
            <Text
              style={{
                color: "rgba(2, 1, 1, 0.8)",
                fontFamily: "pm",
                fontSize: 20,
                top: 2,
              }}
            >
              Search here
            </Text>
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
          <Ionicons name="search" size={30} color="rgba(10, 9, 9, 0.73)" />
        </TouchableOpacity>
      </View>
      {!state.UrlTile && (
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
          <Ionicons name="layers" size={34} color="#5DB996" />
        </TouchableOpacity>
      )}

      <View
        style={{
          position: "absolute",
          top: 160,
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
      {!state.track && (
        <TouchableOpacity
          onPress={startTracking}
          style={{
            position: "absolute",
            bottom: 100,
            right: 10,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="locate" size={34} color="rgb(0, 0, 0)" />
        </TouchableOpacity>
      )}
      {state.track && (
        <TouchableOpacity
          onPress={stopTracking}
          style={{
            position: "absolute",
            bottom: 100,
            right: 10,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="locate" size={34} color="rgb(10, 171, 179)" />
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
            bottom: 40,
            right: 10,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="close-sharp" size={34} color="black" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={handleSearchViewOpen}
        style={{
          position: "absolute",
          bottom: 160,
          right: 10,
          backgroundColor: "#5571b5",
          borderRadius: 20,
          padding: 10,
          elevation: 5,
        }}
      >
        <MaterialIcons name="directions" size={34} color="white" />
      </TouchableOpacity>

      
      {state.isdirectionVisible && (
        <>
          <Direction
            from={state.from}
            to={state.to}
            setFrom={(value) =>
              setState((prevState) => ({ ...prevState, from: value }))
            }
            setTo={(value) =>
              setState((prevState) => ({ ...prevState, to: value }))
            }
            onClose={() =>
              setState((prevState) => ({
                ...prevState,
                isdirectionVisible: false,
              }))
            }
            bbox={user.bbox}
            OnSearchPress={() => {
              setState((prevState) => ({
                ...prevState,
                isdirectionVisible: false,
              }));
              getPath(state.from, state.to);
            }}
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
              isRouteBottomSheetVisible:false,
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
          <View style={{ padding: 10 }}>
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontFamily: "psemibold",
                  fontSize: 17,
                  marginBottom: 5,
                }}
              >
                {state?.searchPlace.Name}
              </Text>
              <Text
                style={{
                  fontFamily: "pm",
                  fontSize: 15,
                  marginBottom: 5,
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
                marginBottom: 10,
              }}
            />
            <Text
              style={{
                fontFamily: "psemibold",
                fontSize: 17,
                marginBottom: 10,
                color: "rgba(169, 6, 87, 0.87)",
              }}
            >
              Get Direction:
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <TouchableOpacity
                disabled={state.dirLoad}
                onPress={() => {
                  setState((prevState) => ({
                    ...prevState,
                    isdirectionVisible: true,
                    to: {
                      Name: state.searchPlace.Name,
                      lat: state.searchPlace.Latitude,
                      long: state.searchPlace.Longitude,
                    },
                  }));
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
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: "white", marginLeft: 5, fontSize: 14 }}
                >
                  From A Point
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={state.dirLoad}
                onPress={async () => {
                  const res = await AskForLocationPermission();
                  if (res.error !== 103) {
                    Toast.show({
                      type: "error",
                      text1: res.message,
                    });
                    setState((prevState) => ({ ...prevState, dirLoad: false }));
                    return;
                  }
                  let currentLocation = await Location.getCurrentPositionAsync(
                    {}
                  );
                  if (!currentLocation) {
                    Toast.show({
                      type: "error",
                      text1: "Please Turn on your Location",
                    });
                    return;
                  }

                  getPath(
                    {
                      Name: "Your Location",
                      lat: currentLocation?.coords.latitude,
                      long: currentLocation?.coords.longitude,
                    },
                    {
                      Name: state.searchPlace.Name,
                      lat: state.searchPlace.Latitude,
                      long: state.searchPlace.Longitude,
                    }
                  );
                  setState((p) => ({
                    ...p,
                    from: {
                      Name: "Your Location",
                      lat: currentLocation?.coords.latitude,
                      long: currentLocation?.coords.longitude,
                    },
                    to: {
                      Name: state.searchPlace.Name,
                      lat: state.searchPlace.Latitude,
                      long: state.searchPlace.Longitude,
                    },
                  }));
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
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: "white", marginLeft: 5, fontSize: 14 }}
                >
                  From My Location
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                backgroundColor: "white",
                padding: 10,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              {state.searchPlace?.type && state.searchPlace?.type !== "Yes" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontFamily: "pm", fontSize: 17 }}>Type: </Text>
                  <Text style={{ fontSize: 16, fontFamily: "pl" }}>
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
                  <Text style={{ fontFamily: "pm", fontSize: 17 }}>Area: </Text>
                  <Text style={{ fontSize: 16, fontFamily: "pl" }}>
                    {state.searchPlace.area}
                  </Text>
                </View>
              )}
              {state.searchPlace?.street && (
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  <Text style={{ fontFamily: "pm", fontSize: 17 }}>
                    Street:{" "}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "pl",
                      flex: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {state.searchPlace.street}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </BottomSheet>
      )}
      {state.isRouteBottomSheetVisible && (
        <RouteBottomSheet
        setIsBottomSheetVisible={(value) =>
          setState((prevState) => ({
            ...prevState,
            isRouteBottomSheetVisible: value,
          }))
        }
        closeandclear={()=>{
          setState((prevState) => ({
            ...prevState,
            isRouteBottomSheetVisible: false,
          }));

        }}
        >
        <View
          style={{
            flex: 1,
            paddingTop: 40,
            width: "100%",
            height: "120%",
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
        </RouteBottomSheet>
      )}
      <Toast />
    </View>
  );
}
