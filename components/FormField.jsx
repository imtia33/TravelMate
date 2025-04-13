import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Animated } from "react-native";

import { icons } from "../constants";

const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const animatedBorderColor = useState(new Animated.Value(0))[0];

  const isPassword = title === "Password" || title === "Retype password";
  const isEmail = title === "Email";

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedBorderColor, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedBorderColor, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = animatedBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(0, 0, 0)', 'rgb(5, 134, 144)FF'],
  });

  return (
    <View style={[styles.container, otherStyles]}>
      <Text  style={styles.label}>{title}</Text>
      <Animated.View style={[
        styles.inputContainer,
        { 
          borderBottomColor: borderColor, // black with full opacity
          borderTopColor: 'rgb(63, 63, 63)', // black with full opacity
          borderLeftColor: 'rgb(63, 63, 63)', // black with full opacity
          borderRightColor: borderColor, },
        isFocused && styles.inputContainerFocused
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7B7B8B"
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconContainer}>
            <Image
              source={!showPassword ? icons.eyeHide : icons.eye}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        {isEmail && (
          <View style={styles.iconContainer}>
            <Image
              source={icons.email}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'psemibold',
    marginBottom: 8,
    color: '#000',
  },
  inputContainer: {
    width: '100%',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 4,
    borderTopWidth: 1.8,
    borderLeftWidth: 1.8,
    borderRightWidth: 4,
    borderBottomColor: 'rgb(0, 0, 0)', // black with full opacity
    borderTopColor: 'rgb(100, 100, 100)', // black with full opacity
    borderLeftColor: 'rgb(100, 100, 100)', // black with full opacity
    borderRightColor: 'rgba(0, 0, 0, 1)', // black with full opacity
    borderRadius: 20, // sharp edges
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    color: '#333',
    fontFamily: 'pl',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 100,
  },
  iconContainer: {
    marginLeft: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
});

export default FormField;
