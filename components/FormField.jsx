import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";

import { icons } from "../constants";
import { useTheme } from "../context/ThemeProvider";
import { COLORS } from "../constants/theme";

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
  const { isDarkMode } = useTheme();

  const isPassword = title === "Password" || title === "Retype password";
  const isEmail = title === "Email";

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Theme-based styles
  const themeColors = isDarkMode ? COLORS.dark : COLORS.light;
  
  const themedStyles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontFamily: 'Outfit-Medium',
      marginBottom: 8,
      color: themeColors.text,
    },
    inputContainer: {
      width: '100%',
      height: 56,
      paddingHorizontal: 16,
      backgroundColor: themeColors.inputBackground,
      borderWidth: 1,
      borderColor: isFocused ? themeColors.inputBorderFocus : themeColors.inputBorder,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: isDarkMode ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    input: {
      flex: 1,
      color: themeColors.text,
      fontFamily: 'Outfit-Medium',
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
      tintColor: themeColors.icon, // This will color the icons based on theme
    },
  });

  return (
    <View style={[themedStyles.container, otherStyles]}>
      <Text style={themedStyles.label}>{title}</Text>
      <View style={[
        themedStyles.inputContainer,
        isFocused && { borderColor: themeColors.inputBorderFocus }
      ]}>
        <TextInput
          style={themedStyles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={themeColors.placeholder}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          editable={props.editable !== false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={themedStyles.iconContainer}>
            <Image
              source={!showPassword ? icons.eyeHide : icons.eye}
              style={themedStyles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        {isEmail && (
          <View style={themedStyles.iconContainer}>
            <Image
              source={icons.email}
              style={themedStyles.icon}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default FormField;
