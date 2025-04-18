import { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-native";
import * as Location from "expo-location";
import {
  Ionicons,
  FontAwesome,
  MaterialIcons,
  Entypo,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { fetchPhotonResults } from "../lib/pathfinder";
import PickPlace from "./PlaceDirection";

const Direction = ({
  from,
  to,
  setFrom,
  setTo,
  onClose,
  bbox,
  OnSearchPress,
}) => {
  const [animation] = useState(new Animated.Value(0));
  const [searchModal, setsearchModal] = useState(false);
  const [currentfocus, setcurrentfocus] = useState("");
  const [focusText, setFcousText] = useState("");

  const [fromText, setFromText] = useState(from?.Name || "");
  const [toText, setToText] = useState(to?.Name || "");

  const fromY = useRef(new Animated.Value(0)).current;
  const toY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleClose();
        return true;
      }
    );

    return () => {
      backHandler.remove();
    };
  }, []);

  const handleSwap = () => {
    if (!from || !to) return;
    setResults([]);
    Animated.parallel([
      Animated.timing(fromY, {
        toValue: -1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toY, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      fromY.setValue(0);
      toY.setValue(0);

      const tempFrom = from;
      const tempFromText = fromText;

      setFrom(to);
      setFromText(toText);
      setTo(tempFrom);
      setToText(tempFromText);
    });
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(animation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(onClose);
  };

  const slideUp = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

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
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: 24, alignItems: "center", top: 15 }}>
            <FontAwesome
              name={fromText.length > 0 ? "dot-circle-o" : "circle-o"}
              size={17}
              color={fromText.length > 0 ? "#1f9cbf" : "#212121"}
            />
            <View
              style={{
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 7,
                marginBottom: 7,
              }}
            >
              <Entypo name="dots-three-vertical" size={16} color="#9E9E9E" />
            </View>
            <MaterialIcons name="my-location" size={19} color="#E53935" />
          </View>
          <View style={{ width: "80%", marginRight: 10 }}>
            <Animated.View
              style={[
                styles.row,
                {
                  transform: [
                    {
                      translateY: fromY.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [40, 0, -40],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setsearchModal(true);
                    setcurrentfocus("from");
                    setFcousText(fromText);
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "pm",
                      color: fromText ? "#000" : "#5F6368",
                      fontSize: 18,
                      height: 40,
                      top: 7,
                    }}
                  >
                    {fromText ? fromText : "From"}
                  </Text>
                </TouchableOpacity>
                {fromText !== "" && (
                  <TouchableOpacity
                    onPress={() => {
                      setFromText("");
                      setFrom(null);
                    }}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.row,
                {
                  transform: [
                    {
                      translateY: toY.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [40, 0, -40],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setsearchModal(true);
                    setcurrentfocus("to");
                    setFcousText(toText);
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "pm",
                      color: toText ? "#000" : "#5F6368",
                      fontSize: 18,
                      height: 40,
                      top: 7,
                    }}
                  >
                    {toText ? toText : "To"}
                  </Text>
                </TouchableOpacity>
                {toText !== "" && (
                  <TouchableOpacity
                    onPress={() => {
                      setToText("");
                      setTo(null);
                    }}
                    style={styles.clearButton}
                  >
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
          <TouchableOpacity
            onPress={OnSearchPress}
            style={{
              alignSelf: "center",
              marginTop: 10,
              backgroundColor: "rgba(39, 119, 106, 0.5)",
              padding: 10,
              width: 80,
              borderRadius: 10,
              height: 50,
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              style={{ alignSelf: "center" }}
              name="map-search"
              size={24}
              color="white"
            />
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
          currentFocus={currentfocus}
          setsearchModal={setsearchModal}
          setFcousText={setFcousText}
          focusText={focusText}
        />
      )}
    </Animated.View>
  );
};

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
    width: "80%",
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
  },
});

export default Direction;
