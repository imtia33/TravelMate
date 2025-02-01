import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { icons } from '../constants';
import { Ionicons, FontAwesome, MaterialIcons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';

const RouteDisplay = ({ routes, selectedRouteIndex, onRouteSelect, clicked, distance1 }) => {

  const [selectedSubRouteIndex, setSelectedSubRouteIndex] = useState(0);

  if (!routes || routes.length === 0) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingBottom: 50
      }}>
        {clicked && (
          <Text style={{ fontSize: 16, color: '#000', textAlign: 'center' }}>No routes available.</Text>
        )}
      </View>
    );
  }

  const renderRoutes = (subRoutes) => {
    if (!subRoutes || subRoutes.length === 0) return null;

    const routeSummary = subRoutes.reduce((acc, route) => {
      return {
        totalDistance: acc.totalDistance + (route.distance || 0),
        totalFare: acc.totalFare + (route.fare || 0),
        totalStops: subRoutes.length
      };
    }, { totalDistance: 0, totalFare: 0, totalStops: 0 });

    // Group steps by From-To pairs
    const groupedSteps = subRoutes.reduce((acc, route) => {
      const key = `${route.From}-${route.To}`;
      if (!acc[key]) {
        acc[key] = { ...route, vehicles: [] };
      }
      acc[key].vehicles.push({
        vehicle: route.Vehicle,
        fare: route.fare,
        distance: route.distance
      });
      return acc;
    }, {});

    // Filter out duplicate vehicles in each step
    const uniqueGroupedSteps = Object.values(groupedSteps).map(route => {
      const uniqueVehicles = Array.from(new Set(route.vehicles.map(v => v.vehicle)))
        .map(vehicle => route.vehicles.find(v => v.vehicle === vehicle));
      return { ...route, vehicles: uniqueVehicles };
    });
    const uniqueFromToValues = Array.from(new Set(subRoutes.flatMap(route => [route.From, route.To])));

    return (
      <View style={{ marginBottom: 75 }}>
        {/* Route Summary Section */}
        <View style={{
          backgroundColor: '#fff',
          paddingHorizontal: 45,
          borderRadius: 10,
          marginBottom: 15,
          paddingVertical: 15,
          width: '80%',
          alignSelf: 'center'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '80%',
            alignSelf: 'center'
          }}>
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="speedometer" size={24} color="black" />
              <Text style={{ fontSize: 14, color: '#000', marginTop: 5 }}>{distance1[selectedRouteIndex].toFixed(2)} km</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="location-pin" size={21} color="#F02E65" />
              <Text style={{ fontSize: 14, color: '#000', marginTop: 5 }}>{uniqueFromToValues.length} stops</Text>
            </View>
          </View>
        </View>

        {/* Route Steps Section */}
        <View style={{
          backgroundColor: '#fff',
          padding: 15,
          borderRadius: 10
        }}>
          <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 15,
              color: '#333'
            }}>Journey Steps</Text>
          </View>
          {uniqueGroupedSteps.map((route, index) => (
            <View key={index} style={{ marginBottom: 20 }}>
              {/* Origin Point */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10
              }}>
                <FontAwesome
                  name={index === 0 ? "dot-circle-o" : "circle-o"}
                  size={16}
                  color={index === 0 ? "#1f9cbf" : "#000"}
                />
                <Text style={{ marginLeft: 10, fontSize: 14, color: '#333', fontFamily: 'psemibold' }}>{route.From}</Text>
              </View>

              {/* Transport Details */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 25 }}>
                {route.vehicles.map((transportOption, optIndex) => (
                  transportOption.vehicle !== "Walk" ?
                    <View key={optIndex} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f8f8f8',
                      padding: 10,
                      borderRadius: 8,
                      marginRight: 10
                    }}>
                      <View style={{
                        backgroundColor: '#e6f2ff',
                        borderRadius: 8,
                        padding: 8
                      }}>
                        <Image
                          source={icons[getVehicleIcon(transportOption.vehicle)]}
                          style={{ width: 40, height: 40 }}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontSize: 14, color: '#333', fontFamily: "psemibold" }}>{transportOption.vehicle}</Text>
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginTop: 5
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <FontAwesome6 name="bangladeshi-taka-sign" size={14} style={{ bottom: 2 }} color="#0c6b5b" />
                            <Text style={{ fontSize: 14, color: '#000', marginLeft: 4, fontFamily: 'psemibold' }}>
                              {transportOption.fare} BDT
                            </Text>
                          </View>
                          <Text style={{ fontSize: 20, color: '#F02E65' }}> • </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="speedometer" size={22} color="black" />
                            <Text style={{ fontSize: 14, color: '#000', marginLeft: 4, fontFamily: 'psemibold' }}>
                              {transportOption.distance?.toFixed(1)} km
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View> :
                    <View key={optIndex} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f8f8f8',
                      padding: 10,
                      borderRadius: 8,
                      marginRight: 10,
                      minWidth: 230,
                      minHeight: 65
                    }}>
                      <Ionicons name="walk-outline" size={28} color="#F02E65" />
                      <Text style={{ marginLeft: 10, color: '#000', fontSize: 14, fontFamily: 'psemibold' }}>Walk {route.distance?.toFixed(1)} km</Text>
                    </View>
                ))}
              </ScrollView>

              {/* Destination Point */}
              {index === uniqueGroupedSteps.length - 1 && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  marginTop: 10,
                }}>
                  <MaterialIcons name="location-on" size={18} style={{ right: 2 }} color="#F02E65" />
                  <Text style={{ marginLeft: 10, fontSize: 14, color: '#333', fontFamily: 'psemibold' }}>{route.To}</Text>
                </View>
              )}

              {/* Connector Line */}
              {index < uniqueGroupedSteps.length - 1 && (
                <View style={{
                  position: 'absolute',
                  left: 6,
                  top: 25,
                  bottom: -5,
                  width: 2,
                  backgroundColor: '#e0e0e0'
                }} />
              )}
              {index === uniqueGroupedSteps.length - 1 && (
                <View style={{
                  position: 'absolute',
                  left: 6,
                  top: 25,
                  bottom: -5,
                  width: 2,
                  maxHeight: route.Vehicle !== "Walk" ? 87 : 65,
                  backgroundColor: '#e0e0e0'
                }} />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getVehicleIcon = (vehicle) => {
    if (!vehicle) return '';
    const vehicleType = vehicle.split(' ')[0].trim().toLowerCase();
    switch (vehicleType) {
      case 'bus': return 'bus';
      case 'car': return 'car';
      case 'tempu': return 'tempu';
      case 'mahindra': return 'mahindra';
      case 'cng': return 'mahindra';
      case 'tomtom': return 'cng';
      case 'rikshaw': return 'rikshaw';
      case 'auto': return 'rikshaw';
      case 'walk': return 'walk';
      case 'mini': return 'truck';
      default: return '';
    }
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#c1d3fe',
      marginBottom: 100
    }}>
      {/* Main Route Selection */}
      {routes.length > 1 && (
        <View style={{ padding: 10, alignItems: 'center', }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {routes.map((routeGroup, index) => (
              <TouchableOpacity
                key={index}
                style={[{
                  backgroundColor: '#fff',
                  padding: 12,
                  borderRadius: 10,
                  marginHorizontal: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                  width: 60,
                  alignItems: 'center',

                }, selectedRouteIndex === index && { backgroundColor: '#007AFF' }]}
                onPress={() => onRouteSelect(index)}
              >
                <Text style={[{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#333'
                }, selectedRouteIndex === index && { color: '#fff' }]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sub-Route Selection */}
      {routes[selectedRouteIndex]?.length > 1 && (
        <View style={{ padding: 10, alignItems: 'center', }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {routes[selectedRouteIndex].map((subRoute, index) => (
              <TouchableOpacity
                key={index}
                style={[{
                  backgroundColor: '#fff',
                  padding: 12,
                  borderRadius: 10,
                  marginHorizontal: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                  minWidth: 40,
                  alignItems: 'center'
                }, selectedSubRouteIndex === index && { backgroundColor: '#4CAF50' }]}
                onPress={() => setSelectedSubRouteIndex(index)}
              >
                <Text style={[{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#333'
                }, selectedSubRouteIndex === index && { color: '#fff' }]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={{ padding: 10 }}>
        {renderRoutes(routes[selectedRouteIndex][selectedSubRouteIndex] || routes[selectedRouteIndex][0])}
      </ScrollView>
    </View>
  );
};

export default RouteDisplay;
