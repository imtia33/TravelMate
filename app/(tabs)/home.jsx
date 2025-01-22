import React from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { images } from '../../constants';
import { useGlobalContext } from "../../context/GlobalProvider";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TravelCard = ({ image, title, location }) => (
  <View style={styles.travelCard}>
    <Image source={image} style={styles.travelCardImage} />
    <View style={styles.travelCardContent}>
      <Text style={styles.travelCardTitle}>{title}</Text>
      <Text style={styles.travelCardLocation}>{location}</Text>
    </View>
    <TouchableOpacity style={styles.bookmarkButton}>
      <Ionicons name="bookmark-outline" size={24} color="#000" />
    </TouchableOpacity>
  </View>
);

const RecommendedTour = ({ image, title, date, rating }) => (
  <View style={styles.recommendedTour}>
    <Image source={image} style={styles.recommendedTourImage} />
    <View style={styles.recommendedTourContent}>
      <Text style={styles.recommendedTourTitle}>{title}</Text>
      <Text style={styles.recommendedTourDate}>{date}</Text>
      <View style={styles.recommendedTourRating}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.recommendedTourRatingText}>{rating}</Text>
      </View>
    </View>
  </View>
);

export default function Home() {
  const { user } = useGlobalContext();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Image
            source={{ uri: user?.avatar }}
            style={styles.userAvatar}
          />
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Places"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Travel Places</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollView}>
          <TravelCard
            image={images.sample1}
            title="Lofoten"
            location="Norway"
          />
          <TravelCard
            image={images.sample1}
            title="Krabi"
            location="Thailand"
          />
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View>
          <RecommendedTour
            image={images.sample1}
            title="Magical Mauritius - Tour"
            date="9 May - 15 May 2022"
            rating="4.3"
          />
          <RecommendedTour
            image={images.sample1}
            title="Amazon Rainforest Adventure"
            date="17 May - 22 May 2022"
            rating="4.4"
          />
          <RecommendedTour
            image={images.sample1}
            title="Amazon Rainforest Adventure"
            date="17 May - 22 May 2022"
            rating="4.4"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c1d3fe',
    paddingBottom: 40,
  },
  scrollViewContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  menuButton: {
    padding: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    padding: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#3498db',
  },
  horizontalScrollView: {
    marginBottom: 10,
  },
  travelCard: {
    width: SCREEN_WIDTH * 0.6,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  travelCardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  travelCardContent: {
    padding: 10,
  },
  travelCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  travelCardLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 5,
  },
  recommendedTour: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  recommendedTourImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  recommendedTourContent: {
    flex: 1,
    padding: 10,
  },
  recommendedTourTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendedTourDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  recommendedTourRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  recommendedTourRatingText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
});