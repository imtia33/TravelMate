import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet } from "react-native";

const CustomButton = ({ title, handlePress, containerStyles, textStyles, isLoading }) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.button, containerStyles, isLoading && styles.loading]}
      disabled={isLoading}
    >
      <Text style={[styles.text]}>{title}</Text>

      {isLoading && (
        <ActivityIndicator
          animating={isLoading}
          color="#fff"
          size="small"
          style={styles.indicator}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#d92344',
    borderBottomWidth: 4,
    borderTopWidth: 1.8,
    borderLeftWidth: 1.8,
    borderRightWidth: 4,
    borderBottomColor: 'rgb(0, 0, 0)', // black with full opacity
    borderTopColor: 'rgb(62, 62, 62)', // black with full opacity
    borderLeftColor: 'rgb(67, 66, 66)', // black with full opacity
    borderRightColor: 'rgba(0, 0, 0, 1)', // black with full opacity
    borderRadius: 20, // sharp edges
    minHeight: 62,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width:180,
    alignSelf:'center'
  },
  text: {
    color: 'white',
    fontFamily: 'pbold',
    fontSize: 20,
  },
  loading: {
    opacity: 0.5,
  },
  indicator: {
    marginLeft: 8,
  },
});

export default CustomButton;