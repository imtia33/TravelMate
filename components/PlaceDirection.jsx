import { useState, useEffect, useCallback } from "react"
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
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { fetchPhotonResults } from "../lib/pathfinder"
import MapView, { Marker } from "react-native-maps" // Make sure this is installed

const PickPlace = ({
  currentFocus,
  setFrom,
  setFromText,
  setTo,
  setToText,
  onClose,
  bbox,
  setsearchModal,
  focusText,
  setFcousText,
}) => {
  const [animation] = useState(new Animated.Value(0))
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState(new Map())
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [error, setError] = useState(null)
  
  // New states for map preview modal
  const [mapModalVisible, setMapModalVisible] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const throttleDelay = 1000
  const debounceTimeout = 300

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mapModalVisible) {
        // Close map modal first if it's open
        setMapModalVisible(false)
        return true
      }
      handleClose()
      return true
    })

    return () => {
      backHandler.remove()
    }
  }, [animation, mapModalVisible])

  const handleSearch = useCallback(() => {
    const currentTime = Date.now()
    if (currentTime - lastFetchTime < throttleDelay || !focusText.trim()) {
      return
    }

    setLastFetchTime(currentTime)
    setLoading(true)
    setError(null)

    fetchPhotonResults(focusText, setResults, setLoading, cache, setCache, bbox).catch((err) => {
      console.error("Search error:", err)
      setError("Something went wrong. Please try again.")
      setLoading(false)
    })
  }, [focusText, cache, lastFetchTime, bbox])

  useEffect(() => {
    if (!focusText || !focusText.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      handleSearch()
    }, debounceTimeout)

    return () => clearTimeout(timeoutId)
  }, [focusText, handleSearch])

  const handleResultSelect = (item) => {
    try {
      if (currentFocus === "from") {
        setFrom({
          Name: item.Name,
          lat: item.Latitude,
          long: item.Longitude,
        })
        setFromText(item.Name)
      } else {
        setTo({
          Name: item.Name,
          lat: item.Latitude,
          long: item.Longitude,
        })
        setToText(item.Name)
      }

      Keyboard.dismiss()

      setTimeout(() => {
        setsearchModal(false)
      }, 100)
    } catch (error) {
      console.error("Error selecting result:", error)
      setError("Failed to select location. Please try again.")
    }
  }

  // New handler for long press on a result item
  const handleResultLongPress = (item) => {
    setSelectedLocation({
      name: item.Name,
      latitude: item.Latitude,
      longitude: item.Longitude,
      address: item.District,
    })
    setMapModalVisible(true)
  }

  const handleClose = () => {
    Keyboard.dismiss()

    Animated.timing(animation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose()
    })
  }

  const handleClear = () => {
    setFcousText("")
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentFocus === "from" ? "Select starting point" : "Select destination"}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#5F6368" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search location"
            placeholderTextColor="#5F6368"
            value={focusText}
            onChangeText={setFcousText}
            autoFocus={true}
          />
          {focusText.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
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
            <Ionicons name="alert-circle" size={20} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item, index) => `result-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => handleResultSelect(item)} 
                onLongPress={() => handleResultLongPress(item)}
                delayLongPress={500}
                style={styles.resultItem} 
                activeOpacity={0.7}
              >
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
            )}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          />
        ) : !loading && focusText.trim().length > 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={40} color="#BDBDBD" />
            <Text style={styles.noResultsText}>No locations found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          </View>
        ) : null}
      </View>

      {/* Map Preview Modal */}
      <Modal
        visible={mapModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <Text style={styles.mapModalTitle} numberOfLines={1}>
                {selectedLocation?.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setMapModalVisible(false)}
                style={styles.mapModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedLocation && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    title={selectedLocation.name}
                    description={selectedLocation.address}
                  />
                </MapView>
              </View>
            )}
            
            <View style={styles.mapModalFooter}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => {
                  setMapModalVisible(false);
                  if (selectedLocation) {
                    const item = {
                      Name: selectedLocation.name,
                      Latitude: selectedLocation.latitude,
                      Longitude: selectedLocation.longitude,
                    };
                    handleResultSelect(item);
                  }
                }}
              >
                <Text style={styles.selectButtonText}>Select this location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginLeft: 8,
    color: "#E53935",
    fontSize: 14,
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
  longPressHint: {
    fontSize: 12,
    color: "#9E9E9E",
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  noResultsText: {
    fontSize: 18,
    color: "#5F6368",
    fontWeight: "500",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
  },
  // Map Modal Styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  mapModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxHeight: "70%",
    overflow: "hidden",
    elevation: 5,
  },
  mapModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    flex: 1,
  },
  mapModalCloseButton: {
    padding: 4,
  },
  mapContainer: {
    height: 300,
    width: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  selectButton: {
    backgroundColor: "#1f9cbf",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  selectButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default PickPlace