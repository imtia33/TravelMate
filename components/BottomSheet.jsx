import React, { useRef } from "react";
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_HEIGHT = SCREEN_HEIGHT * 0.9; // Fully expanded
const Init_HEIGHT = SCREEN_HEIGHT * 0.4; // Fully expanded
const MIN_HEIGHT = 100; // Fully collapsed
const TAB_BAR_HEIGHT = 70; // Assuming a bottom tab bar height

const BottomSheet = ({ setIsBottomSheetVisible, children, closeandclear }) => {
  const translateY = useRef(new Animated.Value(Init_HEIGHT)).current;
  const lastHeight = useRef(Init_HEIGHT); // Store last position

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true, // Always activate drag
      onPanResponderGrant: () => {
        lastHeight.current = translateY._value; // Store current position when drag starts
      },
      onPanResponderMove: (_, gestureState) => {
        let newHeight = lastHeight.current - gestureState.dy; // Move exactly with user
        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT)); // Restrict movement
        translateY.setValue(newHeight);
      },
      onPanResponderRelease: () => {
        lastHeight.current = translateY._value; // Update last position when user stops dragging
      },
    })
  ).current;

  const closeBottomSheet = () => {
    setIsBottomSheetVisible(false);
    closeandclear();
  };

  return (
    <Animated.View
      style={[styles.bottomSheet, { height: translateY }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <View style={styles.dragHandle} />
        <TouchableOpacity 
          style={{
            backgroundColor: "rgba(203, 202, 202, 0.5)",
            borderRadius: 10,
            padding: 5,
            left:'87%',
            top:15,
          }} 
          onPress={closeBottomSheet}
        >
          <Ionicons name="close" size={30} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#aaa",
    borderRadius: 10,

    position: "absolute",
    left: "50%",
    top: 5,
  },
  // Make the touch area larger
  closeButton: {
    backgroundColor: "rgba(203, 202, 202, 0.5)",
    borderRadius: 10,
    padding: 10, // Increase from 5 to 10
    width: 44, // Explicit width
    height: 44, // Explicit height
    alignItems: "center", // Center the icon
    justifyContent: "center", // Center the icon
    position: "absolute", // Use absolute positioning
    right: 15, // Use right instead of left
    top: 10,
    zIndex: 10, // Ensure it's above other elements
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default BottomSheet;
