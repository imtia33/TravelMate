

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, TouchableOpacity, Keyboard, BackHandler } from "react-native"
import { Ionicons, FontAwesome, MaterialIcons, Entypo, MaterialCommunityIcons } from "@expo/vector-icons"
import PickPlace from "./PlaceDirection"

const Direction = ({ from, to, setFrom, setTo, onClose, bbox, OnSearchPress }) => {
  const [animation] = useState(new Animated.Value(0))
  const [searchModal, setSearchModal] = useState(false)
  const [currentFocus, setCurrentFocus] = useState("")
  const [focusText, setFocusText] = useState("")

  const [fromText, setFromText] = useState(from?.Name || "")
  const [toText, setToText] = useState(to?.Name || "")

  // Animation refs for swap animation
  const fromY = useRef(new Animated.Value(0)).current
  const toY = useRef(new Animated.Value(0)).current

  // Fix: Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)

  useEffect(() => {
    // Update fromText and toText when from/to props change
    if (from?.Name && from.Name !== fromText) {
      setFromText(from.Name)
    }

    if (to?.Name && to.Name !== toText) {
      setToText(to.Name)
    }
  }, [from, to])

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (searchModal) {
        setSearchModal(false)
        return true
      }
      handleClose()
      return true
    })

    return () => {
      isMounted.current = false
      backHandler.remove()
    }
  }, [searchModal])

  const handleSwap = () => {
    if (!from || !to) return

    // Fix: Disable swap button during animation
    Animated.parallel([
      Animated.timing(fromY, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toY, {
        toValue: -1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!isMounted.current) return

      // Reset animation values
      fromY.setValue(0)
      toY.setValue(0)

      // Swap values
      const tempFrom = from
      const tempFromText = fromText

      setFrom(to)
      setFromText(toText)
      setTo(tempFrom)
      setToText(tempFromText)
    })
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

  const handleOpenSearch = (type) => {
    setCurrentFocus(type)
    setFocusText(type === "from" ? fromText : toText)
    setSearchModal(true)
  }

  const handleClearLocation = (type) => {
    try {
      if (type === "from") {
        setFromText("")
        setFrom(null)
      } else {
        setToText("")
        setTo(null)
      }
    } catch (error) {
      console.error(`Error clearing ${type}:`, error)
    }
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
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find directions</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.directionsContainer}>
          <View style={styles.iconColumn}>
            <FontAwesome
              name={fromText.length > 0 ? "dot-circle-o" : "circle-o"}
              size={17}
              color={fromText.length > 0 ? "#1f9cbf" : "#212121"}
              style={styles.fromIcon}
            />
            <View style={styles.dotLine}>
              <Entypo name="dots-three-vertical" size={16} color="#9E9E9E" />
            </View>
            <MaterialIcons name="my-location" size={19} color="#E53935" style={styles.toIcon} />
          </View>

          <View style={styles.inputsColumn}>
            <Animated.View
              style={[
                styles.inputRow,
                {
                  transform: [
                    {
                      translateY: fromY.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [-40, 0, 40],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.inputContainer, fromText ? styles.inputContainerActive : null]}
                onPress={() => handleOpenSearch("from")}
                activeOpacity={0.7}
              >
                <Text style={[styles.inputText, fromText ? styles.inputTextActive : null]} numberOfLines={1}>
                  {fromText ? fromText : "From"}
                </Text>
                {fromText !== "" && (
                  <TouchableOpacity
                    onPress={() => handleClearLocation("from")}
                    style={styles.clearButton}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.inputRow,
                {
                  transform: [
                    {
                      translateY: toY.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [-40, 0, 40],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.inputContainer, toText ? styles.inputContainerActive : null]}
                onPress={() => handleOpenSearch("to")}
                activeOpacity={0.7}
              >
                <Text style={[styles.inputText, toText ? styles.inputTextActive : null]} numberOfLines={1}>
                  {toText ? toText : "To"}
                </Text>
                {toText !== "" && (
                  <TouchableOpacity
                    onPress={() => handleClearLocation("to")}
                    style={styles.clearButton}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {(fromText || toText) && (
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwap}
              disabled={!from || !to}
              activeOpacity={!from || !to ? 0.5 : 0.2}
            >
              <Ionicons name="swap-vertical" size={24} color={!from || !to ? "#BDBDBD" : "#1f9cbf"} />
            </TouchableOpacity>
          )}
        </View>

        {from && to && (
          <TouchableOpacity onPress={OnSearchPress} style={styles.searchButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="map-search" size={24} color="white" />
            <Text style={styles.searchButtonText}>Find Route</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchModal && (
        <PickPlace
          bbox={bbox}
          setFrom={setFrom}
          setTo={setTo}
          setFromText={setFromText}
          setToText={setToText}
          currentFocus={currentFocus}
          setsearchModal={setSearchModal}
          setFcousText={setFocusText}
          focusText={focusText}
          onClose={() => setSearchModal(false)}
        />
      )}
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
    backgroundColor: "#fff",
    zIndex: 10,
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
    color: "#212121",
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    flex: 1,
  },
  directionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconColumn: {
    width: 24,
    alignItems: "center",
    marginTop: 5,
  },
  fromIcon: {
    marginTop: 2,
  },
  dotLine: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 3,
  },
  toIcon: {
    marginTop: 2,
  },
  inputsColumn: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: "#F1F3F4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: "relative",
  },
  inputContainerActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  inputText: {
    fontSize: 16,
    color: "#5F6368",
    paddingRight: 30,
  },
  inputTextActive: {
    color: "#000",
    fontWeight: "500",
  },
  clearButton: {
    position: "absolute",
    right: 8,
    top: 12,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f9cbf",
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: "center",
    width: 150,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
})

export default Direction
