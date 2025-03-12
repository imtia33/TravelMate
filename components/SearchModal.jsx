import { useState, useEffect, useCallback } from "react"
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, Animated, Keyboard, BackHandler, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { fetchPhotonResults } from "../lib/pathfinder"

const SearchModal = ({
  searchText,
  setSearchText,
  setSearchLocationCords,
  setShowSearchMarker,
  mapRef,
  setsearchPlace,
  onClose,
  bbox
}) => {
  const [showMainSearch, setShowMainSearch] = useState(false)
  const [animation] = useState(new Animated.Value(0))
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState(new Map())
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [error, setError] = useState(null)

  const throttleDelay = 1000
  const debounceTimeout = 300

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start()

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => {
      backHandler.remove();
      Animated.timing(animation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start()
    }
  }, [animation])

  const handleSearch = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastFetchTime < throttleDelay) {
      return;
    }
    setLastFetchTime(currentTime);

    fetchPhotonResults(searchText, setResults, setLoading, cache, setCache,bbox)
      .catch((err) => {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      });
  }, [searchText, cache, lastFetchTime]);

  useEffect(() => {
    if (!searchText) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, debounceTimeout);

    return () => clearTimeout(timeoutId);
  }, [searchText, handleSearch]);

  const handleResultSelect = async(item) => {
    
    setSearchText(item.Name)
    if (setsearchPlace) {
      setsearchPlace(item)
    }
    setSearchLocationCords([item.Latitude, item.Longitude])
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: item.Latitude,
          longitude: item.Longitude,
        },
        pitch: 0,
        heading: 0,
        zoom: 15,
      },
      { duration: 500 },
    )
    setShowMainSearch(false)
    setShowSearchMarker(true)
    handleClose()
  }

  const handleClose = () => {
    Keyboard.dismiss()
    Animated.timing(animation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(onClose)
  }

  const slideUp = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  })

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animation,
          transform: [{ translateY: slideUp }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#5F6368" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search here"
            placeholderTextColor="#5F6368"
            value={searchText}
            onChangeText={(text) => {
              setShowMainSearch(true)
              setSearchText(text)
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText("")
                setShowMainSearch(false)
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#5F6368" />
            </TouchableOpacity>
          )}
        </View>
        {loading && <ActivityIndicator size="small" color="#0000ff" />}
        {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
        {results.length > 0 && showMainSearch && (
          <FlatList
            data={results}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleResultSelect(item)} style={styles.resultItem}>
                <Ionicons name="location" size={20} color="#4285F4" style={styles.locationIcon} />
                <View>
                  <Text style={styles.resultName}>{item.Name}</Text>
                  <Text style={styles.resultAddress}>{item.District}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
          />
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgb(255, 255, 255)",
  },
  content: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F4",
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
    elevation: 3,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
  },
  clearButton: {
    padding: 4,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 16,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    elevation: 1,
  },
  locationIcon: {
    marginRight: 12,
  },
  resultName: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  resultAddress: {
    fontSize: 14,
    color: "#5F6368",
    marginTop: 2,
  },
})

export default SearchModal
