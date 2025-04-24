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
const MAX_HEIGHT = SCREEN_HEIGHT * 0.6;
const Init_HEIGHT = SCREEN_HEIGHT * 0.4;
const MIN_HEIGHT = 45;

const BottomSheet = ({ setIsBottomSheetVisible, children, closeandclear }) => {
  const translateY = useRef(new Animated.Value(Init_HEIGHT)).current;
  const lastHeight = useRef(Init_HEIGHT);

  const closeBottomSheet = () => {
    setIsBottomSheetVisible(false);
    closeandclear();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastHeight.current = translateY._value;
      },
      onPanResponderMove: (_, gestureState) => {
        let newHeight = lastHeight.current - gestureState.dy;
        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT));
        translateY.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const attemptedHeight = lastHeight.current - gestureState.dy;
        if (attemptedHeight < MIN_HEIGHT) {
          closeBottomSheet();
        } else {
          lastHeight.current = translateY._value;
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.bottomSheet, { height: translateY }]}>
      <View style={styles.header}>
        <View
          style={{
            width: 50,
            height: 5,
            backgroundColor: "#aaa",
            borderRadius: 10,
            position: "absolute",
            left: "52%",
            top: 5,
            marginLeft: -25,
            zIndex: 2,
          }}
          {...panResponder.panHandlers} 
        />
        <View
          style={styles.dragHandle}
          {...panResponder.panHandlers}
        />
        <TouchableOpacity style={styles.closeButton} onPress={closeBottomSheet}>
          <Ionicons style={{right:2,bottom:2}} name="close" size={30} color="black" />
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
    paddingTop: 10,
    paddingBottom: 0,
    
  },
  dragHandle: {
    width: '95%',
    height: 60,
    borderRadius: 10,
    position: "absolute",
    top: 5,
    marginLeft: -25, // center align
    zIndex: 2,
    marginBottom:50,
  },
  closeButton: {
    borderRadius: 10,
    padding: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 15,
    top: 10,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
});

export default BottomSheet;
