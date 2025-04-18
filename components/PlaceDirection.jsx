

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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { fetchPhotonResults } from "../lib/pathfinder"

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

  const throttleDelay = 1000
  const debounceTimeout = 300

  // Fix: Removed showMainSearch state as it was causing the modal to not reopen

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 200, // Increased for smoother animation
      useNativeDriver: true,
    }).start()

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose()
      return true
    })

    return () => {
      backHandler.remove()
    }
  }, [animation])

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

      // Fix: Dismiss keyboard before closing modal
      Keyboard.dismiss()

      // Fix: Use a timeout to ensure state updates before closing
      setTimeout(() => {
        setsearchModal(false)
      }, 100)
    } catch (error) {
      console.error("Error selecting result:", error)
      setError("Failed to select location. Please try again.")
    }
  }

  const handleClose = () => {
    Keyboard.dismiss()

    // Fix: Ensure animation completes before closing modal
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

    // Fix: Don't automatically close modal or clear location when clearing search text
    // This allows users to start a new search
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
})

export default PickPlace
