import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING = 10;

const TrendingCard = ({ item, index, scrollX }) => {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + SPACING),
    index * (CARD_WIDTH + SPACING),
    (index + 1) * (CARD_WIDTH + SPACING),
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </Animated.View>
  );
};

const TrendingSection = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const trendingData = [
    { id: '1', title: 'Trending 1', description: 'This is trending item 1' },
    { id: '2', title: 'Trending 2', description: 'This is trending item 2' },
    { id: '3', title: 'Trending 3', description: 'This is trending item 3' },
    { id: '4', title: 'Trending 4', description: 'This is trending item 4' },
    { id: '5', title: 'Trending 5', description: 'This is trending item 5' },
  ];

  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      const newIndex = Math.round(value / (CARD_WIDTH + SPACING));
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    });

    return () => {
      scrollX.removeListener(listener);
    };
  }, [currentIndex, scrollX]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trending</Text>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollViewContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {trendingData.map((item, index) => (
          <TrendingCard key={item.id} item={item} index={index} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>
      <View style={styles.pagination}>
        {trendingData.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              currentIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 15,
  },
  scrollViewContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: SPACING / 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#333',
    transform: [{ scale: 1.2 }],
  },
});

export default TrendingSection;