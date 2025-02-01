import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions,StyleSheet,ScrollView ,Modal, FlatList, Animated, Easing,BackHandler} from 'react-native';
import MapView, { PROVIDER_DEFAULT, Polyline, Marker } from 'react-native-maps';
import { Ionicons, Entypo,FontAwesome,MaterialIcons } from '@expo/vector-icons';
import {  useSQLiteContext } from 'expo-sqlite';
import RouteDisplay from '../../components/RouteDisplay';
import { useGlobalContext } from "../../context/GlobalProvider";
import * as Location from 'expo-location';
const { width, height } = Dimensions.get('window');

const customMapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#72ddf7" } 
    ]
  }
];
export default function Main() {
  const {user} = useGlobalContext();  //user is the user object from the global context
  const db = useSQLiteContext(); //db is the database object from the sqlite context
  const [routeData, setRouteData] = useState([]); //routeData is the data of the route
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0); //selectedRouteIndex is the index of the selected route
  const [to, setto] = useState("") //to is the destination
  const [from, setfrom] = useState("") //from is the source
  const [polylines, setPolylines] = useState([]); //polylines is the array of polylines
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapType, setMapType] = useState('standard'); //mapType is the type of the map
  const [showPath, setShowPath] = useState(false); //showPath is the boolean value to show the path
  const [location, setLocation] = useState(null); //location is the current location of the user
  const [heading, setHeading] = useState(null); //heading is the heading of the user
  const [searchtext, setsearchtext] = useState() //searchtext is the text of the search
  const [showsearchmarker, setshowsearchmarker] = useState(false) //showsearchmarker is the boolean value to show the search marker
  const [showsearchlocation, setshowsearchlocation] = useState([]) //showsearchlocation is the array of the search location
  const [isMarkerVisible, setIsMarkerVisible] = useState(false); //isMarkerVisible is the boolean value to show the marker
  const [showmainsearch, setshowmainsearch] = useState(false) //showmainsearch is the boolean value to show the main search
  const [polyliner, setPolyliner] = useState([]); //polyliner is the array of the polylines
  const [isModalVisible, setisModalVisible] = useState(false); //isModalVisible is the boolean value to show the modal
  const [clicked, setclicked] = useState(false) //clicked is the boolean value to show the clicked
  const [resultsfrom, setResultsfrom] = useState([]); //resultsfrom is the array of the results from
  const [resultsto, setResultsto] = useState([]); //resultsto is the array of the results to
  const [roaddistance, setroaddistance] = useState([]); //roaddistance is the array of the road distance
  const [currentdistance, setcurrentdistance] = useState(null); //currentdistance is the current distance
  const [extrapoly, setExtrapoly] = useState([]); //extrapoly is the array of the extrapoly
  const [track, settrack] = useState(false); //track is the boolean value to show the track
  const mapRef = useRef(null); //mapRef is the reference of the map
  const sidebarAnimation = React.useRef(new Animated.Value(-width)).current; //sidebarAnimation is the animation of the sidebar
  const bottomSheetAnimation = new Animated.Value(height); //bottomSheetAnimation is the animation of the bottom sheet










  //make polyline smoother
  const smoothPolyline = (points, iterations = 2) => {
    for (let i = 0; i < iterations; i++) {
      let newPoints = [];
      for (let j = 0; j < points.length - 1; j++) {
        let p1 = points[j];
        let p2 = points[j + 1];
  
        let q = [(0.75 * p1[0] + 0.25 * p2[0]), (0.75 * p1[1] + 0.25 * p2[1])];
        let r = [(0.25 * p1[0] + 0.75 * p2[0]), (0.25 * p1[1] + 0.75 * p2[1])];
  
        newPoints.push(q, r);
      }
      points = newPoints;
    }
    return points;
  };

  //log center coordinates
  const logCenterCoordinates = async () => {
    if (mapRef.current) {
      const region = await mapRef.current.getCamera();
    }
  };

  //locate current position
  const locateCurrentPosition = async () => {
    track ? settrack(false) : settrack(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);

    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 0.001,
        distanceInterval: 0.001,
      },
      (newLocation) => {
        setLocation(newLocation);
        mapRef.current?.animateToRegion({
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          latitudeDelta: 0.00001, 
          longitudeDelta: 0.00435, 
        }, 500);
      }
    );

    const headingSubscription = await Location.watchHeadingAsync((newHeading) => {
      setHeading(newHeading.trueHeading);
    });

    return () => {
      locationSubscription.remove();
      headingSubscription.remove();
    };
  }


 //sidebar style
  const sidebarStyle = {
    transform: [{ translateX: sidebarAnimation }],
  };

  const toggleSidebar = () => {
    const newValue = isSidebarOpen ? -width : 0;
    Animated.timing(sidebarAnimation, {
      toValue: newValue,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    setIsSidebarOpen(prev => !prev);
  };
  //selecting route 1,2,3....
  const handleRouteSelect = (index) => {
    const selectedDistance = roaddistance[index];
    setcurrentdistance(selectedDistance);
    setSelectedRouteIndex(index);
    if (polylines[index]) {
      setPolyliner(polylines[index]);
      setExtrapoly(polylines.filter((_, i) => i !== index));
    }
  };
  //secondary search with from and to
  const handleSearchPress = async() => {
    if(from === "" || to === "" && from===to){
      return;
    }
    await getBestRoute(from, to);
    
    setclicked(true);
    setShowPath(true);
    setIsSidebarOpen(true);
    toggleSidebar();
    setisModalVisible(false);
  };
  //find closest location
  const findClosestLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return null;
    }
    const currentLocation = await Location.getCurrentPositionAsync({});
    const userPos = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude
    };
    const locations = await db.getAllAsync('SELECT * FROM locations WHERE single = true');
    let closestLocation = null;
    let minDistance = Infinity;

    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = toRadians(lat1);
      const φ2 = toRadians(lat2);
      const Δφ = toRadians(lat2 - lat1);
      const Δλ = toRadians(lon2 - lon1);

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    };

    for (const loc of locations) {
      const locCoords = JSON.parse(loc.Coordinates)[0];
      const distance = calculateDistance(
        userPos.latitude,
        userPos.longitude,
        locCoords[0],
        locCoords[1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = loc;
      }
    }

    return closestLocation;
  } catch (error) {
    console.error('Error finding closest location:', error);
    return null;
  }
  };
  //secondary search with to and closest location using from value
  const handleSearchPress2 = async () => {
  if (to === "") {
    return;
  }
  
  const closestLocation = await findClosestLocation();
  if (closestLocation) {
    if(closestLocation.Name===to){
                  setto(item.Name);
                  setResultsto([]);
                  setshowsearchmarker(true);
                  setshowmainsearch(false);
                  setclicked(false);  
                  setShowPath(false);
                  setRouteData([]);
                  setPolylines([]);
                  setPolyliner([]);
                  setExtrapoly([]);
                  setshowsearchlocation(JSON.parse(item.Coordinates)[0]);
                  mapRef.current?.animateCamera({
                    center: {
                      latitude: showsearchlocation[0],
                      longitude: showsearchlocation[1],
                    },
                    pitch: 0, // Tilt the camera for a more horizontal view
                    heading: 0, // Keep the heading north
                    zoom: 15, // Adjust zoom level as needed
                    // altitude: 1000, // Adjust altitude for a 3D effect
                  }, { duration: 500 });
      return;
    }
    await getBestRoute(closestLocation.Name, to);
    mapRef.current?.animateCamera({
      center: {
        latitude: showsearchlocation[0],
        longitude: showsearchlocation[1],
      },
      pitch: 0, // Tilt the camera for a more horizontal view
      heading: 0, // Keep the heading north
      zoom: 15, // Adjust zoom level as needed
      altitude: 1000, // Adjust altitude for a 3D effect
    }, { duration: 500 });
    setshowsearchmarker(false);
    setclicked(true);
    setShowPath(true);
    setIsSidebarOpen(true);
    toggleSidebar();
    setisModalVisible(false);
  } else {
    console.error('No closest location found');
  }
 };
  const handleLayersPress = () => {
    setMapType(prevType => (prevType === 'standard' ? 'hybrid' : 'standard'));
  };
  const handleSearchViewOpen = async() => {
    setisModalVisible(true)
  };
  
  const fetchSuggestionsfrom = async (input) => {
    if (input.trim() === '') {
      setResultsfrom([]);
      return;
    }

    try {
      const result = await db.getAllAsync(
        `SELECT * FROM locations WHERE "Name" LIKE ? AND single = true;`,
        [`%${input}%`]
      );
      setResultsfrom(result);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };
  const fetchSuggestionsTo = async (input) => {
    if (input.trim() === '') {
      setResultsto([]);
      return;
    }

    try {
      const result = await db.getAllAsync(
        `SELECT * FROM locations WHERE "Name" LIKE ? AND single = true;`,
        [`%${input}%`]
      );
      setResultsto(result);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };
  const findTop3DistinctRoutes = async (start, end) => {
    const routeCache = new Map();
    const bestRoutes = [];
    const visitedStates = new Map();

    const dfs = async (currentNode, path, totalDistance, visited) => {
        const stateKey = `${currentNode}-${Array.from(visited).join(",")}`;
        if (visitedStates.has(stateKey) && visitedStates.get(stateKey) <= totalDistance) return;
        visitedStates.set(stateKey, totalDistance);

        if (currentNode === end) {
            const newRoute = { path: [...path, end], totalDistance };
            updateBestRoutes(newRoute);
            return;
        }

        visited.add(currentNode);

        const connections = await getRoutesFrom(currentNode);
        const promises = connections.map(async (connection) => {
            const nextNode = connection.To;
            const distance = parseFloat(connection.distanceKm);
            if (!visited.has(nextNode)) {
                await dfs(
                    nextNode,
                    [...path, currentNode],
                    totalDistance + distance,
                    visited
                );
            }
        });
        await Promise.all(promises);

        visited.delete(currentNode); // Backtrack
    };

    const getRoutesFrom = async (from) => {
        if (routeCache.has(from)) return routeCache.get(from);

        const routes = await db.getAllAsync(
            'SELECT * FROM routes WHERE "From" = ?',
            from
        );
        routeCache.set(from, routes);
        return routes;
    };

    const updateBestRoutes = (newRoute) => {
        if (bestRoutes.length < 10) {
            bestRoutes.push(newRoute);
            bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
        } else if (newRoute.totalDistance < bestRoutes[bestRoutes.length - 1].totalDistance ) {
            bestRoutes.pop();
            bestRoutes.push(newRoute);
            bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
        }
    };

    await dfs(start, [], 0, new Set());
    const sortedBestRoutes = bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);

    if (sortedBestRoutes.length < 3) {
        return sortedBestRoutes;
    }

    const finalRoutes = [];
    finalRoutes.push(sortedBestRoutes[0]); // Always include the shortest route

    for (let i = 1; i < sortedBestRoutes.length; i++) {
        const currentRoute = sortedBestRoutes[i];
        const distanceDiff1 = currentRoute.totalDistance - finalRoutes[0].totalDistance;
        const distanceDiff2 = (finalRoutes.length > 1) ? currentRoute.totalDistance - finalRoutes[1].totalDistance : Infinity;

        if (distanceDiff1 >= 0.8 && finalRoutes.length < 3) {
            finalRoutes.push(currentRoute);
        } else if (distanceDiff2 >= 0.8 && finalRoutes.length < 3) {
            finalRoutes.push(currentRoute);
        }
    }

    return finalRoutes;
};
const fetchAndSeparatePaths = async (path) => {
  if (!Array.isArray(path) || path.length === 0) {
    console.error("Invalid path provided to fetchAndSeparatePaths");
    return [];
  }

  const queries = path.map((from, i) =>
      i < path.length - 1
          ? db.getFirstAsync(
              'SELECT * FROM routes WHERE "From" = ? AND "To" = ?;',
              path[i],
              path[i + 1]
            )
          : null
  );
  const results = await Promise.all(queries);

  const separated = [];
  for (const currentData of results) {
      if (!currentData) continue;

      const vehicles = currentData.Vehicles.replace(/[\[\]]/g, "").split(",").map(vehicle => vehicle.trim());
      for (const vehicle of vehicles) {
        separated.push({
          From: currentData.From,
          To: currentData.To,
          Vehicle: vehicle,
          distance: currentData.distanceKm,
          fare: await fare(currentData.distanceKm, vehicle),
          used: false,
        });
      }
  }

  return separated;
};

const merge = async (docs) => {
  if (!Array.isArray(docs) || docs.length === 0) {
    console.error("Invalid documents provided to merge");
    return [];
  }

  const mergedResults = [];
  const usedIndices = new Set();

  for (let i = 0; i < docs.length; i++) {
      if (usedIndices.has(i)) continue; // Skip if already used

      let currentDoc = { ...docs[i] };

      for (let j = 0; j < docs.length; j++) {
          if (i !== j && !usedIndices.has(j)) {
              // Check if the two documents can be merged
              if (currentDoc.To === docs[j].From && currentDoc.Vehicle === docs[j].Vehicle) {
                  currentDoc.To = docs[j].To;
                  currentDoc.distance += docs[j].distance;
                  usedIndices.add(j);
              }
          }
      }
      mergedResults.push(currentDoc);
  }
  return mergedResults;
};


const combination = (separate, merged, From, To) => {
  if (!Array.isArray(merged) || merged.length === 0) {
    console.error("Invalid merged documents provided to combination");
    return [];
  }

  const comb = [];
  
  for (const doc of merged) {
      if (doc.used || doc.Vehicle === "Walk") continue;

      let temp = [];
      if (doc.From === From && doc.To === To) {
          temp.push(doc);
          const matchingMerged = merged.filter(d => d.From === From && d.To === To && d.Vehicle !== doc.Vehicle);
          
          temp.push(...matchingMerged);
          comb.push(temp);

          matchingMerged.forEach(d => d.used = true);
          doc.used = true;
          continue;
      }
      
      temp.push(doc);
      let lastSegment = temp[temp.length - 1];
      let lastTo = lastSegment.To;
      
      const visited = new Set(); 
      
      const addMatchingSegments = (currentTo) => {
          if (visited.has(currentTo)) return;
          visited.add(currentTo);

          let matchingMerged = merged.filter(doc => doc.From === currentTo && !doc.used);
          if (matchingMerged.length > 0) {
              temp.push(...matchingMerged);
              lastTo = matchingMerged[0].To;

              let matchingSeparate = separate.filter(doc => 
                doc.From === matchingMerged[0].From && 
                doc.To === matchingMerged[0].To && 
                doc.Vehicle !== matchingMerged[0].Vehicle
              );

              if (matchingSeparate.length > 0) {
                  temp.push(...matchingSeparate);
                  lastTo = matchingSeparate[0].To;
              }
              addMatchingSegments(lastTo);
          } else {
              let matchingSeparate = separate.filter(doc => doc.From === currentTo && !doc.used);
              if (matchingSeparate.length > 0) {
                  temp.push(...matchingSeparate);
                  lastTo = matchingSeparate[0].To;
                  addMatchingSegments(lastTo);
              }
          }
      };

      addMatchingSegments(lastTo);

      const addBackwardSegments = (currentFrom) => {
          if (visited.has(currentFrom)) return;
          visited.add(currentFrom);

          let matchingMerged = merged.filter(doc => doc.To === currentFrom && !doc.used);
          if (matchingMerged.length > 0) {
              temp = [...matchingMerged, ...temp];
              currentFrom = temp[0].From;

              let matchingSeparate = separate.filter(doc => 
                doc.To === matchingMerged[0].To && 
                doc.From === matchingMerged[0].From && 
                doc.Vehicle !== matchingMerged[0].Vehicle
              );

              if (matchingSeparate.length > 0) {
                  temp = [...matchingSeparate, ...temp];
                  currentFrom = temp[0].From;
              }
              addBackwardSegments(currentFrom);
          } else {
              let matchingSeparate = separate.filter(doc => doc.To === currentFrom && !doc.used);
              if (matchingSeparate.length > 0) {
                  temp = [...matchingSeparate, ...temp];
                  currentFrom = temp[0].From;
                  addBackwardSegments(currentFrom);
              }
          }
      };

      addBackwardSegments(lastSegment.From);

      const uniqueTemp = temp.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.From === item.From && t.To === item.To && t.Vehicle === item.Vehicle && t.distance === item.distance && t.fare === item.fare
        ))
      );

      if (uniqueTemp.length > 0 && uniqueTemp[uniqueTemp.length - 1].To === To && uniqueTemp[0].From === From) {
          comb.push(uniqueTemp);
      }
  }

    let sortedComb = comb.sort((a, b) => {
    const uniqueFromA = new Set(a.map(doc => doc.From)).size;
    const uniqueToA = new Set(a.map(doc => doc.To)).size;
    const uniqueFromB = new Set(b.map(doc => doc.From)).size;
    const uniqueToB = new Set(b.map(doc => doc.To)).size;

    return (uniqueFromA + uniqueToA) - (uniqueFromB + uniqueToB);
  });
  if(sortedComb.length > 2){
  sortedComb = sortedComb.slice(0, 2);
  }

  if (sortedComb[0] && sortedComb[1] && sortedComb[0].length === sortedComb[1].length) {
      const similarDocs = [];

      for (const doc of sortedComb) {
          const uniqueFrom = new Set(doc.map(d => d.From));
          const uniqueTo = new Set(doc.map(d => d.To));

          for (const otherDoc of sortedComb) {
              if (doc === otherDoc) continue;

              const otherUniqueFrom = new Set(otherDoc.map(d => d.From));
              const otherUniqueTo = new Set(otherDoc.map(d => d.To));

              const commonFrom = new Set([...uniqueFrom].filter(x => otherUniqueFrom.has(x)));
              const commonTo = new Set([...uniqueTo].filter(x => otherUniqueTo.has(x)));

              if (commonFrom.size > 0 || commonTo.size > 0) {
                  similarDocs.push(...otherDoc);
              }
          }
      }

      if (similarDocs.length > 0) {
          sortedComb[0].push(...similarDocs);
          return [sortedComb[0]];
      }
  }

  return sortedComb;
};


const getBestRoute = async (From, To) => {
  try {
    let bestRoute = await findTop3DistinctRoutes(From, To);
    let data = [];
    let newPolylines = [];
    for (const doc of bestRoute) {
      if (!doc.path) {
        console.error("Invalid path in bestRoute document:", doc);
        continue;
      }
      roaddistance.push(doc.totalDistance)
      let separate = await fetchAndSeparatePaths(doc.path);
      let merged = await merge(separate);
      let res = combination(separate, merged, From, To);
      data.push(res);
      let polylineData = await polylinemaker(doc.path);
      newPolylines.push(polylineData);
    }
    setRouteData(data);
    setPolylines(newPolylines);
    setPolyliner(newPolylines[0]);
    setExtrapoly(newPolylines.filter((_, i) => i !== 0));
    const selectedDistance = roaddistance[0];
    setcurrentdistance(selectedDistance);
    
  } catch (error) {
    console.error("Error in getBestRoute:", error);
  }
};
const fetchFare = async () => {
  try {
    const fareData = await db.getAllAsync('SELECT * FROM Fare');
    const fareRules = {};
    fareData.forEach((item) => {
      fareRules[item.Vehicle] = {
        farePKM: item.farePKM,
        fareMin: item.fareMin,
        fareFixed: item.fareFixed,
      };
    });

    return fareRules;
  } catch (error) {
    return {};
  }
};

const fare = async (distance, vehicle) => {
  const fareRules = await fetchFare(); 
  if (!fareRules[vehicle]) return 0;
  const rule = fareRules[vehicle];
  if (rule.fareFixed !== null) return rule.fareFixed;
  if (rule.farePKM !== null) {
    return Math.max(Math.ceil(distance * rule.farePKM), rule.fareMin);
  }
  return 0;
};

const polylinemaker = async (path) => {
  const queries = [];
  for (let i = 0; i < path.length - 1; i++) {
    let res = await db.getFirstAsync('SELECT * FROM locations WHERE "Name" = ?', `${path[i]}-${path[i + 1]}`);
         if(i<path.length - 1){
          
          if (res && res.Coordinates2) {
            const coordinatesArray = JSON.parse(res.Coordinates2);
            queries.push(...coordinatesArray);
          }
         }
         else{
          if (res && res.Coordinates) {
           const coordinatesArray = JSON.parse(res.Coordinates);
           queries.push(...coordinatesArray);
          }
         }
         
  }
  //console.log(queries)
  return queries;
};

 return (
  <View style={{flex: 1, marginBottom: 0, backgroundColor: '#EDEDF0'}}>
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={{...StyleSheet.absoluteFillObject}}
      customMapStyle={customMapStyle} 
      mapType={mapType}
      showsCompass={true}
      showsTraffic={true}
      initialRegion={{
        latitude: user.Lat,
        longitude: user.Long,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {
        polylines.map((poly, index) => (
          <React.Fragment key={index}>
          <Polyline
            coordinates={poly.map(([longitude, latitude]) => ({
              latitude,
              longitude,
            }))}
            strokeColor="#5f5f78"
            strokeWidth={12}
          />
          <Polyline
            coordinates={poly.map(([longitude, latitude]) => ({
              latitude,
              longitude,
            }))}
            strokeColor="#D9EAFD"
            strokeWidth={8}
            tappable={true}
            onPress={() => {
              setSelectedRouteIndex(index);
              setPolyliner(poly);
              const extraPolylines = polylines.filter((_, i) => i !== index).slice(0, 2); // Get up to 2 extra polylines
              setExtrapoly(extraPolylines);
            }}
          />
          </React.Fragment>
        ))
      }
      {(showPath && polyliner) && (
        <>
        <Polyline
          coordinates={polyliner.map(([longitude, latitude]) => ({
            latitude,
            longitude,
          }))}
          strokeColor="#030370"
          strokeWidth={14}
        />
        <Polyline
          coordinates={polyliner.map(([longitude, latitude]) => ({
            latitude,
            longitude,
          }))}
          strokeColor="#0000FF"
          strokeWidth={10}
          tappable={true}
        /></>
      )}
      
      {polyliner.length > 0 && (
        <Marker
          coordinate={{
            latitude: polyliner[polyliner.length - 1][1],
            longitude: polyliner[polyliner.length - 1][0],
          }}
          title={to}
        />
      )}
      {showsearchlocation&&showsearchmarker && (
        <Marker
          coordinate={{
            latitude: showsearchlocation[0],
            longitude: showsearchlocation[1],
          }}
          title={to}
        />
      )}
      
      {location && track && (
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          rotation={heading}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <MaterialIcons style={{left:11,top:2}} name="navigation" size={30} color="#FD366E" />
        </Marker>
      )}
    </MapView>
    {isMarkerVisible && (
      <View style={{position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -28}}>
        <Text style={{fontSize: 24, color: 'red'}}>📍</Text>
      </View>
    )}

    <View style={{position: 'absolute', top: 40, left: 10, right: 10, height: 50, backgroundColor: '#c1d3fe', borderRadius: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, elevation: 5}}>
      {clicked && (
        <TouchableOpacity onPress={toggleSidebar} style={{padding: 5}}>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
      )}
      <TextInput
        style={{flex: 1, height: 40, marginLeft: 10, fontSize: 16}}
        placeholder="Search here"
        placeholderTextColor="#000"
        value={to}
        onChangeText={(text) => {
          setshowmainsearch(true);
          setto(text);
          fetchSuggestionsTo(text);
        }}
      />
      {resultsto.length > 0 && !(resultsto.length === 1 && from === resultsto[0].Name) && showmainsearch && (
        <View style={{position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderRadius: 10, elevation: 5, width: 300}}>
          <FlatList
            data={resultsto}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => {
                  setto(item.Name);
                  setResultsto([]);
                  setshowsearchmarker(true);
                  setshowmainsearch(false);
                  setclicked(false);  
                  setShowPath(false);
                  setRouteData([]);
                  setPolylines([]);
                  setPolyliner([]);
                  setExtrapoly([]);
                  setshowsearchlocation(JSON.parse(item.Coordinates)[0]);
                  mapRef.current?.animateCamera({
                    center: {
                      latitude: showsearchlocation[0],
                      longitude: showsearchlocation[1],
                    },
                    pitch: 0, // Tilt the camera for a more horizontal view
                    heading: 0, // Keep the heading north
                    zoom: 15, // Adjust zoom level as needed
                    // altitude: 1000, // Adjust altitude for a 3D effect
                  }, { duration: 500 });
                }}
                style={{paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ccc'}}
              >
                <Text style={{ fontSize: 16, color: '#212121' }}>{item.Name}</Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 150 }}
            nestedScrollEnabled
          />
        </View>
      )}
      {useEffect(() => {
        const backHandler = () => {
          setshowmainsearch(false);
          return true;
        };

        const backHandlerListener = BackHandler.addEventListener('hardwareBackPress', backHandler);

        return () => backHandlerListener.remove();
      }, [])}
      <TouchableOpacity onPress={handleSearchPress2} style={{padding: 5}}>
        <Ionicons name="search" size={24} color="black" />
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity onPress={handleLayersPress} style={{position: 'absolute', bottom: 100, alignSelf:'start', backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5,left:10}}>
      <Ionicons name="layers" size={24} color="#5DB996" />
    </TouchableOpacity>
    <View style={{position: 'absolute', top: 150, right: 10, flexDirection: 'column', alignItems: 'center'}}>
      {polylines.map((_, index) => ( 
        <TouchableOpacity
          key={index}
          onPress={() => handleRouteSelect(index)}
          style={{backgroundColor: selectedRouteIndex === index ? '#4169E1' : 'white', borderRadius: 20, width: 40, height: 40, elevation: 5, marginBottom: 10, justifyContent:'center', alignItems:'center'}}
        >
          <Text style={{fontSize: 16, color: selectedRouteIndex === index ? 'white' : 'black', alignSelf:'center'}}>{index + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <TouchableOpacity onPress={locateCurrentPosition} style={{position: 'absolute', bottom: 100, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5}}>
      <Ionicons name="locate" size={24} color="black" />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={handleSearchViewOpen} 
      style={{position: 'absolute', bottom: 150, right: 10, backgroundColor: '#5571b5', borderRadius: 20, padding: 10, elevation: 5}}>
      <MaterialIcons name="directions" size={24} color="white" />
    </TouchableOpacity>
    <Animated.View style={[{position: 'absolute', top: 0, left: 0, width: '100%', height: '120%', backgroundColor: '#c1d3fe', elevation: 10}, sidebarStyle]}>
      <TouchableOpacity onPress={toggleSidebar} style={{position: 'absolute', top: 40, right: 10, zIndex: 1}}>
        <Ionicons name="close" size={24} color="black" />
      </TouchableOpacity>
      <View style={{flex: 1, paddingTop: 40, width: '100%', paddingHorizontal: 5, marginBottom:0}}>
        {routeData.length > 0 && (
        <RouteDisplay 
          routes={routeData} 
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={handleRouteSelect}
          distance1={roaddistance}
        />)}
      </View>
    </Animated.View>
    {isModalVisible && (
      <>
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF'}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 8, top:50}}>
            <TouchableOpacity
              style={{padding: 8, bottom:50,right:10}}
              onPress={() => setisModalVisible(false)}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <View style={{flexDirection:'column', justifyContent:'space-between', height:75,alignContent:'center'}}>
              <FontAwesome style={{marginLeft:1}} name={from.length > 0 ? "dot-circle-o" : "circle-o"} size={17} color={from.length > 0 ? "#1f9cbf" : "black"} />
              <Entypo style={{marginLeft:1}} name="dots-three-vertical" size={16} color="black"/>
              <MaterialIcons style={{right:1,}} name="my-location" size={19} color="red" />
            </View>
            
            <View style={{flex: 1, marginLeft: 3, marginRight: 5}}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <View style={{flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2}}>
                  <TextInput
                    style={{fontSize: 16, color: '#212121', paddingVertical: 8, paddingHorizontal: 16}}
                    placeholder="Your location"
                    placeholderTextColor="#5F6368"
                    value={from}
                    onChangeText={(text) => {
                      setfrom(text);
                      fetchSuggestionsfrom(text);
                    }}
                  />
                  {resultsfrom.length > 0 && !(resultsfrom.length === 1 && from === resultsfrom[0].Name) && (
                    <FlatList
                      data={resultsfrom}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          onPress={() => {
                            setfrom(item.Name);
                            setResultsfrom([]);
                          }}
                          style={{paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ccc'}}
                        >
                          <Text style={{ fontSize: 16, color: '#212121' }}>{item.Name}</Text>
                        </TouchableOpacity>
                      )}
                      style={{ maxHeight: 150 }}
                      nestedScrollEnabled
                    />
                  )}
                </View>
              </View>

              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2}}>
                  <TextInput
                    style={{fontSize: 16, color: '#212121', paddingVertical: 8, paddingHorizontal: 16}}
                    placeholder="Choose destination"
                    placeholderTextColor="#5F6368"
                    value={to}
                    onChangeText={(text) => {
                      setto(text);
                      fetchSuggestionsTo(text);
                    }}
                  />
                  {resultsto.length > 0 && !(resultsto.length === 1 && from === resultsto[0].Name) && (
                    <FlatList
                      data={resultsto}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          onPress={() => {
                            setto(item.Name);
                            setResultsto([]);
                          }}
                          style={{paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ccc'}}
                        >
                          <Text style={{ fontSize: 16, color: '#212121' }}>{item.Name}</Text>
                        </TouchableOpacity>
                      )}
                      style={{ maxHeight: 150 }}
                      nestedScrollEnabled
                    />
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={{padding: 8, width: 46, height: 46, borderRadius:25, backgroundColor:'#4285F4', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4}}
              onPress={handleSearchPress}
            >
              <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </>
    )}
  </View>
);
}
