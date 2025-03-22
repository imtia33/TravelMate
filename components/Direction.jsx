import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Text, 
  Keyboard, 
  StyleSheet, 
  BackHandler 
} from 'react-native';
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
  const [focusedField, setFocusedField] = useState(null);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (focusedField) {
        // If a field is focused, unfocus it and clear results
        setFocusedField(null);
        Keyboard.dismiss();
        setResultsFrom([]);
        setResultsTo([]);
        return true; // Prevent default back action
      }
      return false; // Let default back action happen
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [focusedField, setResultsFrom, setResultsTo]);

  const handleFocus = (field) => {
    setFocusedField(field);
    if (field === 'from' && from.trim() !== '') {
      fetchSuggestionsFrom(from);
    } else if (field === 'to' && to.trim() !== '') {
      fetchSuggestionsTo(to);
    }
  };

  const handleClear = (field) => {
    if (field === 'from') {
      setFrom('');
      setResultsFrom([]);
    } else if (field === 'to') {
      setTo('');
      setResultsTo([]);
    }
  };

  const handleOutsidePress = () => {
    setFocusedField(null);
    setResultsFrom([]);
    setResultsTo([]);
    Keyboard.dismiss();
  };

  // Show suggestions only if there's text and the field is focused
  const showFromSuggestions = focusedField === 'from' && 
    from.trim() !== '' && 
    resultsFrom.length > 0 && 
    !(resultsFrom.length === 1 && from === resultsFrom[0].Name);
    
  const showToSuggestions = focusedField === 'to' && 
    to.trim() !== '' && 
    resultsTo.length > 0 && 
    !(resultsTo.length === 1 && to === resultsTo[0].Name);

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      style={styles.container} 
      onPress={handleOutsidePress}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Directions</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.directionContainer}>
          <View style={styles.iconColumn}>
            <FontAwesome 
              name={from.length > 0 ? "dot-circle-o" : "circle-o"} 
              size={17} 
              color={from.length > 0 ? "#1f9cbf" : "#212121"} 
            />
            <View style={styles.dotConnector}>
              <Entypo name="dots-three-vertical" size={16} color="#9E9E9E" />
            </View>
            <MaterialIcons name="my-location" size={19} color="#E53935" />
          </View>
          
          <View style={styles.inputsColumn}>
            {/* From input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Starting location"
                placeholderTextColor="#5F6368"
                value={from}
                onFocus={() => handleFocus('from')}
                onChangeText={(text) => {
                  setFrom(text);
                  if (text.trim() === '') {
                    setResultsFrom([]);
                  } else {
                    fetchSuggestionsFrom(text);
                  }
                }}
              />
              {from.length > 0 && (
                <TouchableOpacity onPress={() => handleClear('from')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* To input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Choose destination"
                placeholderTextColor="#5F6368"
                value={to}
                onFocus={() => handleFocus('to')}
                onChangeText={(text) => {
                  setTo(text);
                  if (text.trim() === '') {
                    setResultsTo([]);
                  } else {
                    fetchSuggestionsTo(text);
                  }
                }}
              />
              {to.length > 0 && (
                <TouchableOpacity onPress={() => handleClear('to')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Search button positioned below inputs */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={async () => {
                await handleSearchPress();
                if (to && to.Coordinates) {
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
                }
              }}
            >
              <Ionicons  name="search" size={30} color="white" style={styles.searchIcon} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* From suggestions overlay */}
        {showFromSuggestions && (
          <View style={{
            position: 'absolute',
            left: 52, // Align with the input fields (accounting for the icon column)
            right: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            zIndex: 10, // Higher than other elements
            top: 70, // Position to overlay the content, adjust as needed
          }}>
            <FlatList
              data={resultsFrom}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    setFrom(item.Name);
                    setResultsFrom([]);
                    setFocusedField(null);
                    Keyboard.dismiss();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: index < resultsFrom.length - 1 ? 1 : 0,
                    borderBottomColor: index < resultsFrom.length - 1 ? '#000' : 'transparent',
                  }}
                >
                  <Text style={styles.suggestionText}>{item.Name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              nestedScrollEnabled
            />
          </View>
        )}
        
        {/* To suggestions overlay */}
        {showToSuggestions && (
          <View style={{
            position: 'absolute',
            left: 52, // Align with the input fields (accounting for the icon column)
            right: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            zIndex: 10, // Higher than other elements
            top: 130, // Position to overlay the content, adjust as needed
          }}>
            <FlatList
              data={resultsTo}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    setTo(item.Name);
                    setResultsTo([]);
                    setFocusedField(null);
                    Keyboard.dismiss();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: index < resultsTo.length - 1 ? 1 : 0,
                    borderBottomColor: index < resultsTo.length - 1 ? '#000' : 'transparent',
                  }}
                >
                  <Text style={styles.suggestionText}>{item.Name}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              nestedScrollEnabled
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: '#212121',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  directionContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  iconColumn: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 12,
    zIndex: 1,
  },
  dotConnector: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsColumn: {
    flex: 1,
    gap: 16,
    zIndex: 1,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    color: '#212121',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionText: {
    fontSize: 16,
    color: '#212121',
  },
  searchButton: {
    marginTop: 0,
    height: 50,
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    width:50,
    alignSelf:'flex-end'
  },
  searchIcon: {
    marginRight: 8,
    left:2
  },
  searchText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Direction;