import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

// We'll use a simple icon component instead of relying on external libraries
const Icon = ({ name }) => {
  const icons = {
    'chevron-up': '▲',
    'chevron-down': '▼',
    'check': '✓',
  };
  return <Text style={styles.icon}>{icons[name]}</Text>;
};

const DropdownItem = {
  label: '',
  value: '',
};

const CustomDropdownProps = {
  data: [],
  value: '',
  onChange: () => {},
  placeholder: '',
  containerStyle: {},
  buttonStyle: {},
  buttonTextStyle: {},
  dropdownStyle: {},
  itemStyle: {},
  itemTextStyle: {},
  selectedItemStyle: {},
  selectedItemTextStyle: {},
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const EnhancedCustomDropdown = ({
  data,
  value,
  onChange,
  placeholder,
  containerStyle,
  buttonStyle,
  buttonTextStyle,
  dropdownStyle,
  itemStyle,
  itemTextStyle,
  selectedItemStyle,
  selectedItemTextStyle,
}) => {
  const [visible, setVisible] = useState(false);
  const selectedItem = data.find(item => item.value === value);
  const dropdownHeight = Math.min(SCREEN_HEIGHT * 0.4, data.length * 50);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const toggleDropdown = useCallback(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    } else {
      setVisible(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, animatedValue]);

  const renderItem = useCallback(({ item }) => {
    const isSelected = item.value === value;
    return (
      <TouchableOpacity
        style={[
          styles.item,
          itemStyle,
          isSelected && styles.selectedItem,
          isSelected && selectedItemStyle,
        ]}
        onPress={() => {
          onChange(item.value);
          toggleDropdown();
        }}
      >
        <Text
          style={[
            styles.itemText,
            itemTextStyle,
            isSelected && styles.selectedItemText,
            isSelected && selectedItemTextStyle,
          ]}
        >
          {item.label}
        </Text>
        {isSelected && <Icon name="check" />}
      </TouchableOpacity>
    );
  }, [value, onChange, toggleDropdown, itemStyle, itemTextStyle, selectedItemStyle, selectedItemTextStyle]);

  const dropdownAnimation = useMemo(() => ({
    opacity,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
    ],
  }), [opacity, animatedValue]);

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, buttonTextStyle]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Icon name={visible ? 'chevron-up' : 'chevron-down'} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="none">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDropdown}
        >
          <Animated.View
            style={[
              styles.dropdown,
              { height: dropdownHeight },
              dropdownStyle,
              dropdownAnimation,
            ]}
          >
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              bounces={false}
            />
          </Animated.View>
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
    width: 200,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    color: '#007AFF',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItem: {
    backgroundColor: '#F0F8FF',
  },
  selectedItemText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default EnhancedCustomDropdown;

