import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const HistoryPicker = ({ 
  data, 
  onSelect, 
  placeholder = "Select a place",
  title = "Recent Places",
  TriggerComponent,
  isDarkMode, // Add isDarkMode prop
  ItemComponent,
  HeaderComponent,
  CloseComponent,
  CheckComponent
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setIsVisible(false);
    if (onSelect) onSelect(item);
  };

  const renderDefaultItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        {
          borderBottomColor: isDarkMode ? '#2C2C2E' : '#f0f0f0',
          backgroundColor: pressed ? (isDarkMode ? '#2C2C2E' : '#F0F0F0') : 'transparent'
        }
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[styles.itemText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.name || item.Name}</Text>
      {(selectedItem?.name || selectedItem?.Name) === (item.name || item.Name) && (
        CheckComponent ? CheckComponent() : <Ionicons name="checkmark" size={18} color="#007AFF" />
      )}
    </Pressable>
  );

  const renderDefaultTrigger = () => (
    <Pressable
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDarkMode ? '#2C2C2E' : '#DDDDDD',
          width: 120, // Set width to 120
        },
        pressed && { backgroundColor: isDarkMode ? '#2C2C2E' : '#F0F0F0' }
      ]}
      onPress={() => setIsVisible(true)}
    >
      <Text style={[styles.triggerText, !selectedItem && styles.placeholder, { 
        color: selectedItem ? (isDarkMode ? '#FFFFFF' : '#000000') : (isDarkMode ? '#888888' : '#888888')
      }]}>
        {selectedItem ? (selectedItem.name || selectedItem.Name) : placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={isDarkMode ? '#B7B7B7' : '#3B3B3B'} />
    </Pressable>
  );

  const renderDefaultHeader = () => (
    <View style={[styles.header, { 
      backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
      borderBottomColor: isDarkMode ? '#2C2C2E' : '#EEEEEE'
    }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{title}</Text>
      <Pressable onPress={() => setIsVisible(false)}>
        {CloseComponent ? CloseComponent() : <Ionicons name="close" size={24} color={isDarkMode ? '#B7B7B7' : '#3B3B3B'} />}
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {TriggerComponent ? 
        TriggerComponent({ isVisible, setIsVisible, selectedItem, placeholder, isDarkMode }) : 
        renderDefaultTrigger()
      }

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setIsVisible(false)}>
          <Pressable style={[styles.content, { 
            backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF'
          }]}>
            {HeaderComponent ? HeaderComponent({ title, setIsVisible, isDarkMode }) : renderDefaultHeader()}
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={ItemComponent || renderDefaultItem}
              style={styles.list}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    
  },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  triggerPressed: {
  },
  triggerText: {
    fontSize: 16,
  },
  placeholder: {
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 12,
    width: '80%',
    maxHeight: '50%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    padding: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemPressed: {
  },
  itemText: {
    fontSize: 16,
  },
});

export default HistoryPicker;