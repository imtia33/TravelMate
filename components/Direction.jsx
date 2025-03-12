import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text } from 'react-native';
import { Ionicons, FontAwesome, Entypo, MaterialIcons } from '@expo/vector-icons';

const Direction = ({
  from,
  setFrom,
  to,
  setTo,
  resultsFrom,
  resultsTo,
  fetchSuggestionsFrom,
  fetchSuggestionsTo,
  handleSearchPress,
  setShowSearchLocation,
  setResultsFrom,
  setResultsTo,
  mapRef,
  onClose,
}) => {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 8, top: 50 }}>
        <TouchableOpacity
          style={{ padding: 8, bottom: 50, right: 10 }}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'column', justifyContent: 'space-between', height: 75, alignContent: 'center' }}>
          <FontAwesome style={{ marginLeft: 1 }} name={from.length > 0 ? "dot-circle-o" : "circle-o"} size={17} color={from.length > 0 ? "#1f9cbf" : "black"} />
          <Entypo style={{ marginLeft: 1 }} name="dots-three-vertical" size={16} color="black" />
          <MaterialIcons style={{ right: 1, }} name="my-location" size={19} color="red" />
        </View>
        <View style={{ flex: 1, marginLeft: 3, marginRight: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}>
              <TextInput
                style={{ fontSize: 16, color: '#212121', paddingVertical: 8, paddingHorizontal: 16 }}
                placeholder="Your location"
                placeholderTextColor="#5F6368"
                value={from}
                onChangeText={(text) => {
                  setFrom(text);
                  fetchSuggestionsFrom(text);
                }}
              />
              {resultsFrom.length > 0 && !(resultsFrom.length === 1 && from === resultsFrom[0].Name) && (
                <FlatList
                  data={resultsFrom}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setFrom(item.Name);
                        setResultsFrom([]);
                      }}
                      style={{ paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}>
              <TextInput
                style={{ fontSize: 16, color: '#212121', paddingVertical: 8, paddingHorizontal: 16 }}
                placeholder="Choose destination"
                placeholderTextColor="#5F6368"
                value={to}
                onChangeText={(text) => {
                  setTo(text);
                  fetchSuggestionsTo(text);
                }}
              />
              {resultsTo.length > 0 && !(resultsTo.length === 1 && from === resultsTo[0].Name) && (
                <FlatList
                  data={resultsTo}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setTo(item.Name);
                        setResultsTo([]);
                      }}
                      style={{ paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}
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
          style={{ padding: 8, width: 46, height: 46, borderRadius: 25, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
          onPress={async () => {
            await handleSearchPress();
            const location = JSON.parse(to.Coordinates)[0];
            setShowSearchLocation(location);
            mapRef.current?.animateCamera({
              center: {
                latitude: location[0],
                longitude: location[1],
              },
              pitch: 0,
              heading: 0,
              zoom: 15,
            }, { duration: 500 });
          }}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Direction;




