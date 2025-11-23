import React from "react";
import { ActivityIndicator, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useTheme } from "../context/ThemeProvider";
import { COLORS } from "../constants/theme";

const CustomButton = ({ 
  title, 
  handlePress, 
  containerStyles, 
  textStyles, 
  isLoading,
  variant = "default",
  size = "default",
  ...props 
}) => {
  const { isDarkMode } = useTheme();

  const buttonVariants = {
    default: {
      backgroundColor: isDarkMode ? COLORS.dark.button : COLORS.light.button,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: isDarkMode ? COLORS.dark.border : COLORS.light.border,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    destructive: {
      backgroundColor: isDarkMode ? COLORS.dark.error : COLORS.light.error,
    },
  };

  const textVariants = {
    default: {
      color: isDarkMode ? COLORS.dark.buttonText : COLORS.light.buttonText,
    },
    outline: {
      color: isDarkMode ? COLORS.dark.text : COLORS.light.text,
    },
    ghost: {
      color: isDarkMode ? COLORS.dark.text : COLORS.light.text,
    },
    destructive: {
      color: isDarkMode ? COLORS.dark.buttonText : COLORS.light.buttonText,
    },
  };

  const sizeVariants = {
    default: {
      paddingHorizontal: 20, // Increased from 16 to 20
      paddingVertical: 10,  // Increased from 8 to 10
    },
    sm: {
      paddingHorizontal: 16, // Increased from 12 to 16
      paddingVertical: 8,   // Increased from 6 to 8
    },
    lg: {
      paddingHorizontal: 28, // Increased from 24 to 28
      paddingVertical: 12,  // Increased from 10 to 12
    },
    icon: {
      paddingHorizontal: 0,
    },
  };

  const selectedButtonVariant = buttonVariants[variant] || buttonVariants.default;
  const selectedTextVariant = textVariants[variant] || textVariants.default;
  const selectedSizeVariant = sizeVariants[size] || sizeVariants.default;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.baseButton,
        selectedButtonVariant,
        selectedSizeVariant,
        containerStyles,
        isLoading && styles.loading,
        pressed && { opacity: 0.8 },
      ]}
      {...props}
    >
      <Text 
        style={[
          styles.text,
          {paddingHorizontal:17},
          selectedTextVariant,
          { fontFamily: 'Outfit-Medium' },
          textStyles
        ]}
      >
        {title}
      </Text>

      {isLoading && (
        <ActivityIndicator
          animating={isLoading}
          color={selectedTextVariant.color}
          size="small"
          style={styles.indicator}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    gap: 8,
    alignSelf: 'flex-start',
    minWidth: 40,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  loading: {
    opacity: 0.5,
  },
  indicator: {
    marginLeft: 8,
  },
});

export default CustomButton;