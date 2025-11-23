import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to light mode
        setIsDarkMode(false);
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light').catch(error => {
      console.error('Failed to save theme', error);
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};