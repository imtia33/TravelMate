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
const MIN_HEIGHT = 100; // Fully collapsed
const TAB_BAR_HEIGHT = 70; // Assuming a bottom tab bar height

const BottomSheet = ({ setIsBottomSheetVisible, children, closeandclear }) => {
  const translateY = useRef(new Animated.Value(MIN_HEIGHT)).current;
  const lastHeight = useRef(MIN_HEIGHT); // Store last position

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
          style={styles.closeButton}
          onPress={closeBottomSheet}
        >
          <Ionicons name="close" size={24} color="black" />
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
    
    position:'absolute',
    left:'50%'
  },
  closeButton: {
    backgroundColor: "rgba(203, 202, 202, 0.5)",
    borderRadius: 10,
    padding: 5,
    left:'90%',
    top:10
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default BottomSheet;
