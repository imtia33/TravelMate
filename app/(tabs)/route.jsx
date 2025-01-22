import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions,StyleSheet,ScrollView ,Modal, FlatList, Animated, Easing} from 'react-native';
import MapView, { PROVIDER_DEFAULT, Polyline, Marker } from 'react-native-maps';
import { Ionicons, Entypo,FontAwesome,MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import RouteDisplay from '../../components/RouteDisplay';
import * as Location from 'expo-location';
const { width, height } = Dimensions.get('window');
export default function App() {
  return (
    <SQLiteProvider databaseName="routes.db" onInit={migrateDbIfNeeded}>
      <Main />
    </SQLiteProvider>
  );
}
const customMapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#72ddf7" } 
    ]
  }
];
function Main() {
  const db = useSQLiteContext();
  const [routeData, setRouteData] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [to, setto] = useState("")
  const [from, setfrom] = useState("")
  const [polylines, setPolylines] = useState([]); // Changed to state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [showPath, setShowPath] = useState(false);
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [isMarkerVisible, setIsMarkerVisible] = useState(false);
  const [centerCoordinates, setCenterCoordinates] = useState({ latitude: 22.3543296, longitude: 91.8388736 });
  const [polyliner, setPolyliner] = useState([]);
  const [isModalVisible, setisModalVisible] = useState(false);
  const [clicked, setclicked] = useState(false)
  const [resultsfrom, setResultsfrom] = useState([]);
  const [resultsto, setResultsto] = useState([]);
  const mapRef = useRef(null);
  const onGestureEnd = (event) => {
    if (event.nativeEvent.translationX > 100) {
      // Swipe from left to right
      toggleSidebar();
    } else if (event.nativeEvent.translationX < -100) {
      // Swipe from right to left
      toggleSidebar();
    }
  };
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: sidebarAnimation } }],
    { useNativeDriver: true }
  );
  const logCenterCoordinates = async () => {
    if (mapRef.current) {
      const region = await mapRef.current.getCamera();
    }
  };
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
        timeInterval: 1,
        distanceInterval: 0.001,
      },
      (newLocation) => {
        setLocation(newLocation);
        mapRef.current?.animateToRegion({
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
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

  const sidebarAnimation = React.useRef(new Animated.Value(-width)).current;
  const bottomSheetAnimation = new Animated.Value(height);

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
    setIsSidebarOpen(!isSidebarOpen);
  };
  const handleRouteSelect = (index) => {
    setSelectedRouteIndex(index);
    if (polylines[index]) {
      setPolyliner(polylines[index]);
    } 
  };
  
  const handleSearchPress = async() => {
    await getBestRoute(from, to);
    setclicked(true);
    setShowPath(true);
    setIsSidebarOpen(true);
    toggleSidebar();
    setisModalVisible(false);
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
        if (bestRoutes.length < 3) {
            bestRoutes.push(newRoute);
            bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
        } else if (newRoute.totalDistance < bestRoutes[bestRoutes.length - 1].totalDistance) {
            bestRoutes.pop();
            bestRoutes.push(newRoute);
            bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
        }
    };

    await dfs(start, [], 0, new Set());
    return bestRoutes;
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
      let separate = await fetchAndSeparatePaths(doc.path);
      let merged = await merge(separate);
      let res = combination(separate, merged, From, To);
      console.log(res);
      data.push(res);
      let polylineData = await polylinemaker(doc.path);
      newPolylines.push(polylineData);
    }
    setRouteData(data);
    setPolylines(newPolylines);
    setPolyliner(newPolylines[0]);
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
      queries.push(
          db.getFirstAsync('SELECT * FROM locations WHERE "Name" = ?', path[i]),
          db.getFirstAsync('SELECT * FROM locations WHERE "Name" = ?', path[i + 1]),
          db.getFirstAsync('SELECT * FROM locations WHERE "Name" = ?', `${path[i]}-${path[i + 1]}`),
          db.getFirstAsync('SELECT * FROM locations WHERE "Name" = ?', `${path[i + 1]}-${path[i]}`)
      );
  }

  // Run all queries in parallel
  const results = await Promise.all(queries);
  const data = [];

  for (let i = 0; i < results.length; i += 4) {
      const start = results[i];
      const end = results[i + 1];
      const middle = results[i + 2];
      const reverseMiddle = results[i + 3];

      // Add start coordinates if they exist
      if (start && start.Coordinates) {
          const startCoordinates = JSON.parse(start.Coordinates);
          data.push(startCoordinates[0]);
      }

      // Add middle coordinates (or reversed middle coordinates)
      if (middle && middle.Coordinates) {
          const middleCoordinates = JSON.parse(middle.Coordinates);
          data.push(...middleCoordinates);
      } else if (reverseMiddle && reverseMiddle.Coordinates) {
          const reverseCoordinates = JSON.parse(reverseMiddle.Coordinates);
          data.push(...reverseCoordinates.reverse());
      }

      // Add end coordinates if they exist
      if (end && end.Coordinates) {
          const endCoordinates = JSON.parse(end.Coordinates);
          data.push(endCoordinates[0]);
      }
  }

  return data;
};

const [track, settrack] = useState(false);
 return (
  <View style={{flex: 1, marginBottom: 0, backgroundColor: '#EDEDF0'}}>
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={{...StyleSheet.absoluteFillObject}}
      customMapStyle={customMapStyle} 
      mapType={mapType}
      showsTraffic={true}
      initialRegion={{
        latitude: 22.3543296,
        longitude: 91.8388736,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {(showPath&&polyliner) && (
        <Polyline
          coordinates={polyliner.map(([latitude, longitude]) => ({
            latitude,
            longitude
          }))}
          strokeColor="rgba(0, 0, 255, 0.7)"
          strokeWidth={8}
        />
      )}
      {location&& track && (
        <Marker
        coordinate={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }}
        rotation={heading}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <MaterialIcons name="navigation" size={30} color="red" />
      </Marker>
      )}
    </MapView>
    {isMarkerVisible&&(<View style={{position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -28}}>
      <Text style={{fontSize: 24, color: 'red'}}>📍</Text>
    </View>)}

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
      />
      <TouchableOpacity style={{padding: 5}}>
        <Ionicons name="search" size={24} color="black" />
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity onPress={handleLayersPress} style={{position: 'absolute', top: 100, right: 10, backgroundColor: 'white', borderRadius: 20, padding: 10, elevation: 5}}>
      <Ionicons name="layers" size={24} color="black" />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
        <PanGestureHandler onGestureEvent={onGestureEvent} onEnded={onGestureEnd}>
    <Animated.View style={[{position: 'absolute', top: 0, left: 0, width: '100%', height: '120%', backgroundColor: '#c1d3fe', elevation: 10}, sidebarStyle]}>
      <TouchableOpacity onPress={toggleSidebar} style={{position: 'absolute', top: 40, right: 10, zIndex: 1}}>
        <Ionicons name="close" size={24} color="black" />
      </TouchableOpacity>
      <View style={{flex: 1, paddingTop: 40, width: '100%', paddingHorizontal: 5, marginBottom:0}}>
        {/* {clicked && (
        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop:10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{fontFamily:'psemibold', fontSize: 15}}>From:</Text>
            <Text style={{fontFamily:'psemibold', fontSize: 15, marginLeft: 5}}>{from}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{fontFamily:'psemibold', fontSize: 15}}>To:</Text>
            <Text style={{fontFamily:'psemibold', fontSize: 15, marginLeft: 5}}>{to}</Text>
          </View>
        </View>
        )} */}
        {routeData.length > 0 && (
        <RouteDisplay 
          routes={routeData} 
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={handleRouteSelect}
        />)}
      </View>
    </Animated.View>
    </PanGestureHandler>
    </GestureHandlerRootView>
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

async function migrateDbIfNeeded(db) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync('PRAGMA user_version');
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "From" TEXT NOT NULL,
        "To" TEXT NOT NULL,
        Vehicles TEXT,
        distanceKm REAL,
        District TEXT
      );
    `);
    currentDbVersion = 1;
  }
  if (currentDbVersion === 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "Name" TEXT NOT NULL UNIQUE,
        "Coordinates" TEXT NOT NULL
      );
    `);
    currentDbVersion = 2;
  }
  if (currentDbVersion === 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Fare (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Vehicle TEXT NOT NULL,
        farePKM REAL,
        fareMin REAL,
        fareFixed REAL
      );
    `);    
    currentDbVersion = 3;
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
