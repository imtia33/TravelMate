import { useState, useEffect, useCallback, useRef } from "react"
import {
  View, TextInput, TouchableOpacity, FlatList, Text,
  StyleSheet, Animated, Keyboard, BackHandler, ActivityIndicator
} from "react-native"
import * as Location from "expo-location"
import { Ionicons, FontAwesome, MaterialIcons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons'
import { fetchPhotonResults } from "../lib/pathfinder"

const Direction = ({
  from, to, setFrom, setTo, onClose, bbox,OnSearchPress
}) => {
  const [animation] = useState(new Animated.Value(0))
  const [searchText, setSearchText] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState(null)
  const [cache, setCache] = useState(new Map())
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [error, setError] = useState(null)

  const [fromText, setFromText] = useState(from?.Name || "")
  const [toText, setToText] = useState(to?.Name || "")

  const throttleDelay = 1000
  const debounceTimeout = 300

  const fromY = useRef(new Animated.Value(0)).current
  const toY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose()
      return true
    })

    return () => {
      backHandler.remove()
    }
  }, [])

  const handleSearch = useCallback(() => {
    const now = Date.now()
    if (now - lastFetchTime < throttleDelay) return

    setLastFetchTime(now)
    fetchPhotonResults(searchText, setResults, setLoading, cache, setCache, bbox)
      .catch(() => {
        setError("Something went wrong.")
        setLoading(false)
      })
  }, [searchText, lastFetchTime, cache])

  useEffect(() => {
    if (!searchText) {
      setResults([])
      return
    }

    const timeout = setTimeout(() => {
      handleSearch()
    }, debounceTimeout)

    return () => clearTimeout(timeout)
  }, [searchText, handleSearch])

  const handleResultSelect = (item) => {
    const selected = {
      Name: item.Name,
      lat: item.Latitude,
      long: item.Longitude
    }

    if (focus === "from") {
      setFrom(selected)
      setFromText(item.Name)
    } else if (focus === "to") {
      setTo(selected)
      setToText(item.Name)
    }

    setSearchText("")
    setResults([])
  }

  const handleSwap = () => {
    setResults([])
    Animated.parallel([
      Animated.timing(fromY, { toValue: -1, duration: 250, useNativeDriver: true }),
      Animated.timing(toY, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      fromY.setValue(0)
      toY.setValue(0)

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
    }).start(onClose)
  }

  const slideUp = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  })

  return (
    <Animated.View style={[styles.container, {
      opacity: animation,
      transform: [{ translateY: slideUp }]
    }]}>
      <View style={styles.content}>
        <View style={{ flexDirection: "row" }}>
        <View style={{ width: 24, alignItems: 'center', top: 15 }}>
            <FontAwesome 
              name={fromText.length > 0 ? "dot-circle-o" : "circle-o"} 
              size={17} 
              color={fromText.length > 0 ? "#1f9cbf" : "#212121"} 
            />
            <View style={{ height: 40, justifyContent: 'center', alignItems: 'center',marginTop:7,marginBottom:7 }}>
              <Entypo name="dots-three-vertical" size={16} color="#9E9E9E" />
            </View>
            <MaterialIcons name="my-location" size={19} color="#E53935" />
          </View>
          <View style={{ width: "80%", marginRight: 10 }}>
            <Animated.View style={[styles.row, {
              transform: [{ translateY: fromY.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [40, 0, -40]
              }) }]
            }]}>
              
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="From"
                  placeholderTextColor="#5F6368"
                  value={fromText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  onFocus={() => {
                    setFocus("from")
                    setSearchText(fromText)
                  }}
                  onChangeText={(text) => {
                    setFromText(text)
                    setSearchText(text)
                  }}
                  style={styles.input}
                />
                {fromText !== "" && (
                  <TouchableOpacity onPress={() => {
                    setFromText("")
                    setFrom(null)
                  }} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            <Animated.View style={[styles.row, {
              transform: [{ translateY: toY.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [40, 0, -40]
              }) }]
            }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="To"
                  placeholderTextColor="#5F6368"
                  value={toText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  onFocus={() => {
                    setFocus("to")
                    setSearchText(toText)
                  }}
                  onChangeText={(text) => {
                    setToText(text)
                    setSearchText(text)
                  }}
                  style={styles.input}
                />
                {toText !== "" && (
                  <TouchableOpacity onPress={() => {
                    setToText("")
                    setTo(null)
                  }} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
          {(fromText || toText) && (
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <Ionicons name="swap-vertical" size={24} color="#1f9cbf" />
            </TouchableOpacity>
          )}
          
        </View>
        {(fromText || toText) && (
            <TouchableOpacity onPress={OnSearchPress} style={{alignSelf:'center',marginTop:10,backgroundColor:'rgba(39, 119, 106, 0.5)',padding:10,width:80,borderRadius:10,height:50,justifyContent:'center'}} >
              <MaterialCommunityIcons style={{alignSelf:'center'}} name="map-search" size={24} color="white" />
              {/* <Text style={{textAlign:'center',fontFamily:'pm',fontSize:18}}>Search</Text> */}
            </TouchableOpacity>
        )}

        {loading && <ActivityIndicator size="small" color="#0000ff" />}
        {error && <Text style={{ color: 'red' }}>{error}</Text>}

        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleResultSelect(item)}
              >
                <Ionicons name="location" size={20} color="#4285F4" style={styles.resultIcon} />
                <View>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.resultName}>{item.Name}</Text>
                  <Text style={styles.resultAddress}>{item.District}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 5,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#F1F3F4",
    borderRadius: 12,
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "relative",
    width:"80%"
  },
  input: {
    fontSize: 16,
    color: "#212121",
    paddingRight: 30,
  },
  clearButton: {
    position: "absolute",
    right: 8,
    top: 20,
  },
  swapButton: {
    alignSelf: "center",
    marginVertical: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomColor: "#E0E0E0",
    borderBottomWidth: 1,
  },
  resultIcon: {
    marginRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  resultAddress: {
    fontSize: 14,
    color: "#5F6368",
  }
})

export default Direction
