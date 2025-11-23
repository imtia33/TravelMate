import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons'; // Import Expo vector icons

const ThemeToggleButton = ({ style }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      {isDarkMode ? (
        <Ionicons name="sunny" size={22} color="#B5B5B5" />
      ) : (
        <Ionicons name="moon-sharp" size={22} color="#09090B" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    bottom:2,
    right:2
  },
});

export default ThemeToggleButton;