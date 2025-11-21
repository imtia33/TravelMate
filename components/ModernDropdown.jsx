import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { COLORS } from '../constants/theme';

// Simple icon component
const Icon = ({ name, size = 16, color }) => {
  const { isDarkMode } = useTheme();
  const iconColor = color || (isDarkMode ? COLORS.dark.text : COLORS.light.text);
  
  const icons = {
    'chevron-down': '▼',
    'chevron-up': '▲',
    'check': '✓',
  };
  
  return (
    <Text style={[styles.icon, { fontSize: size, color: iconColor }]}>
      {icons[name]}
    </Text>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ModernDropdown = ({
  data,
  value,
  onChange,
  placeholder = 'Select an option',
  containerStyle,
  buttonStyle,
  buttonTextStyle,
  itemStyle,
  itemTextStyle,
  selectedItemStyle,
  selectedItemTextStyle,
}) => {
  const { isDarkMode } = useTheme();
  const [visible, setVisible] = useState(false);
  const selectedItem = data.find(item => item.value === value);
  const dropdownHeight = Math.min(SCREEN_HEIGHT * 0.4, data.length * 50);

  const toggleDropdown = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const renderItem = useCallback(({ item }) => {
    const isSelected = item.value === value;
    return (
      <TouchableOpacity
        style={[
          styles.item,
          isDarkMode ? styles.darkItem : styles.lightItem,
          itemStyle,
          isSelected && styles.selectedItem,
          isSelected && selectedItemStyle,
          isDarkMode && isSelected && styles.darkSelectedItem,
        ]}
        onPress={() => {
          onChange(item.value, item.Lat, item.Long, item.bbox);
          toggleDropdown();
        }}
      >
        <Text
          style={[
            styles.itemText,
            isDarkMode ? styles.darkItemText : styles.lightItemText,
            itemTextStyle,
            isSelected && styles.selectedItemText,
            isSelected && selectedItemTextStyle,
            isDarkMode && isSelected && styles.darkSelectedItemText,
          ]}
        >
          {item.label}
        </Text>
        {isSelected && <Icon name="check" size={16} />}
      </TouchableOpacity>
    );
  }, [value, onChange, toggleDropdown, itemStyle, itemTextStyle, selectedItemStyle, selectedItemTextStyle, isDarkMode]);

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          isDarkMode ? styles.darkButton : styles.lightButton,
          buttonStyle,
        ]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text 
          style={[
            styles.buttonText,
            isDarkMode ? styles.darkButtonText : styles.lightButtonText,
            buttonTextStyle,
            !selectedItem && (isDarkMode ? styles.darkPlaceholder : styles.lightPlaceholder),
          ]}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Icon 
          name={visible ? 'chevron-up' : 'chevron-down'} 
          color={isDarkMode ? COLORS.dark.text : COLORS.light.text}
        />
      </TouchableOpacity>
      
      <Modal 
        visible={visible} 
        transparent 
        animationType="none"
        onRequestClose={toggleDropdown}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDropdown}
        >
          <View
            style={[
              styles.dropdown,
              isDarkMode ? styles.darkDropdown : styles.lightDropdown,
              { maxHeight: dropdownHeight },
            ]}
          >
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              bounces={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    minWidth: 180, // Increased from 120 to 180
    borderRadius: 6,
    borderWidth: 1,
  },
  lightButton: {
    backgroundColor: COLORS.light.card,
    borderColor: COLORS.light.border,
  },
  darkButton: {
    backgroundColor: COLORS.dark.card,
    borderColor: COLORS.dark.border,
  },
  buttonText: {
    fontSize: 16,
    flex: 1,
  },
  lightButtonText: {
    color: COLORS.light.text,
  },
  darkButtonText: {
    color: COLORS.dark.text,
  },
  lightPlaceholder: {
    color: COLORS.light.placeholder,
  },
  darkPlaceholder: {
    color: COLORS.dark.placeholder,
  },
  icon: {
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    borderRadius: 6,
    width: '90%', // Increased from 80% to 90%
    maxWidth: SCREEN_WIDTH * 0.9, // Use screen width instead of fixed 300
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  lightDropdown: {
    backgroundColor: COLORS.light.card,
  },
  darkDropdown: {
    backgroundColor: COLORS.dark.card,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  lightItem: {
    borderBottomColor: COLORS.light.border,
  },
  darkItem: {
    borderBottomColor: COLORS.dark.border,
  },
  itemText: {
    fontSize: 16,
  },
  lightItemText: {
    color: COLORS.light.text,
  },
  darkItemText: {
    color: COLORS.dark.text,
  },
  selectedItem: {
    backgroundColor: COLORS.light.primaryLight,
  },
  darkSelectedItem: {
    backgroundColor: COLORS.dark.primaryLight,
  },
  selectedItemText: {
    fontWeight: '600',
    color: COLORS.light.primary,
  },
  darkSelectedItemText: {
    fontWeight: '600',
    color: COLORS.dark.primary,
  },
});

export default ModernDropdown;