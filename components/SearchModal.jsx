
import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  Animated,
  Keyboard,
  BackHandler,
  ActivityIndicator,
  StatusBar,
} from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { fetchPhotonResults } from "../lib/pathfinder"

const SearchModal = ({
  searchText,
  setSearchText,
  setSearchLocationCords,
  setShowSearchMarker,
  mapRef,
  setsearchPlace,
  onClose,
  bbox,
}) => {
  const [animation] = useState(new Animated.Value(0))
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState(new Map())
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [error, setError] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])

  // Ref to track if component is mounted
  const isMounted = useRef(true)

  // Constants for throttling and debouncing
  const throttleDelay = 1000
  const debounceTimeout = 300

  useEffect(() => {
    // Start entrance animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 200, // Slightly longer for smoother animation
      useNativeDriver: true,
    }).start()

    // Handle back button press
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose()
      return true
    })

    // Load recent searches from storage (mock implementation)
    // In a real app, you'd use AsyncStorage or similar
    const loadRecentSearches = async () => {
      // Mock data - replace with actual storage implementation
      setRecentSearches([
        // Example format - replace with your actual data structure
        { Name: "Recent location 1", District: "District 1", Latitude: 37.7749, Longitude: -122.4194 },
        { Name: "Recent location 2", District: "District 2", Latitude: 40.7128, Longitude: -74.006 },
      ])
    }

    loadRecentSearches()

    // Cleanup function
    return () => {
      isMounted.current = false
      backHandler.remove()
    }
  }, [])

  const handleSearch = useCallback(() => {
    // Don't search if text is empty or too short
    if (!searchText || searchText.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    // Throttle requests
    const currentTime = Date.now()
    if (currentTime - lastFetchTime < throttleDelay) {
      return
    }

    setLastFetchTime(currentTime)
    setLoading(true)
    setError(null)

    fetchPhotonResults(searchText, setResults, setLoading, cache, setCache, bbox).catch((err) => {
      console.error("Search error:", err)
      if (isMounted.current) {
        setError("Something went wrong. Please try again.")
        setLoading(false)
      }
    })
  }, [searchText, cache, lastFetchTime, bbox])

  useEffect(() => {
    // Debounce search requests
    if (!searchText || searchText.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        handleSearch()
      }
    }, debounceTimeout)

    return () => clearTimeout(timeoutId)
  }, [searchText, handleSearch])

  const handleResultSelect = (item) => {
    try {
      // Update search text with selected location name
      setSearchText(item.Name)

      // Update search place if setter is provided
      if (setsearchPlace) {
        setsearchPlace(item)
      }

      // Update coordinates for the map
      setSearchLocationCords([item.Latitude, item.Longitude])

      // Animate map to the selected location
      if (mapRef.current) {
        mapRef.current.animateCamera(
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
      }

      // Show marker on the map
      setShowSearchMarker(true)

      // Save to recent searches (mock implementation)
      // In a real app, you'd use AsyncStorage or similar
      saveToRecentSearches(item)

      // Close the modal
      handleClose()
    } catch (error) {
      console.error("Error selecting result:", error)
      setError("Failed to select location. Please try again.")
    }
  }

  const saveToRecentSearches = (item) => {
    // Mock implementation - replace with actual storage logic
    // This would typically involve AsyncStorage or similar
    const updatedRecents = [item, ...recentSearches.filter((search) => search.Name !== item.Name).slice(0, 4)]
    setRecentSearches(updatedRecents)
  }

  const handleClose = () => {
    Keyboard.dismiss()

    // Exit animation
    Animated.timing(animation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (onClose && isMounted.current) {
        onClose()
      }
    })
  }

  const handleClear = () => {
    setSearchText("")
    setResults([])
    setError(null)
  }

  const slideUp = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  })

  const renderResultItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleResultSelect(item)} style={styles.resultItem} activeOpacity={0.7}>
      <Ionicons name="location" size={20} color="#4285F4" style={styles.locationIcon} />
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.Name}
        </Text>
        <Text style={styles.resultAddress} numberOfLines={1}>
          {item.District}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyResults = () => {
    if (loading) return null

    if (searchText && searchText.trim().length >= 2 && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={40} color="#BDBDBD" />
          <Text style={styles.emptyText}>No locations found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      )
    }

    return null
  }

  const renderRecentSearches = () => {
    if (searchText || recentSearches.length === 0) return null

    return (
      <View style={styles.recentsContainer}>
        <Text style={styles.recentsTitle}>Recent Searches</Text>
        {recentSearches.map((item, index) => (
          <TouchableOpacity
            key={`recent-${index}`}
            onPress={() => handleResultSelect(item)}
            style={styles.recentItem}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={20} color="#757575" style={styles.locationIcon} />
            <View style={styles.resultTextContainer}>
              <Text style={styles.resultName} numberOfLines={1}>
                {item.Name}
              </Text>
              <Text style={styles.resultAddress} numberOfLines={1}>
                {item.District}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Location</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#5F6368" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search for a place or address"
            placeholderTextColor="#5F6368"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#5F6368" />
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1f9cbf" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleSearch} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderRecentSearches()}

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item, index) => `result-${index}`}
            renderItem={renderResultItem}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyResults}
          />
        ) : (
          renderEmptyResults()
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
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
    color: "#212121",
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3F4",
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
    elevation: 2,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    height: 50,
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: "#5F6368",
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: "#E53935",
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E53935",
    borderRadius: 4,
  },
  retryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#5F6368",
    fontWeight: "500",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
  },
  recentsContainer: {
    marginBottom: 16,
  },
  recentsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginVertical: 4,
  },
})

export default SearchModal
