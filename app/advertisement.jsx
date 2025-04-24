
import { useRef, useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  ImageBackground,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, router } from "expo-router"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { icons } from "../constants"

const { width, height } = Dimensions.get("window")

const MenuScreen = () => {
  const { data } = useLocalSearchParams()
  const restaurantData = JSON.parse(data)
  restaurantData.Tags = JSON.parse(restaurantData.Tags)

  const [activeCategory, setActiveCategory] = useState(Object.keys(restaurantData.Tags)[0])
  const [showFullImage, setShowFullImage] = useState(false)
  
  // Create refs for each category section to scroll to
  const sectionRefs = useRef({})
  const mainScrollViewRef = useRef(null)
  
  const goback = () => {
    router.back()
    setTimeout(() => {
      const place = {
        name: restaurantData.Name,
        location: restaurantData.Location,
        Lat: restaurantData.lat,
        Long: restaurantData.long,
      }
      router.push({ pathname: "/route", params: { data: JSON.stringify(place) } })
    }, 1)
  }

  // Simplified header height animation without scroll effects
  const headerHeight = useRef(new Animated.Value(250)).current

  useEffect(() => {
    Animated.timing(headerHeight, {
      toValue: showFullImage ? height * 0.7 : 250,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [showFullImage])

  const scrollToCategory = (category) => {
    setActiveCategory(category)
    if (sectionRefs.current[category] && mainScrollViewRef.current) {
      // Use a timeout to ensure the UI has updated before measuring
      setTimeout(() => {
        sectionRefs.current[category].measureLayout(
          mainScrollViewRef.current,
          (x, y) => {
            mainScrollViewRef.current.scrollTo({ y: y - 100, animated: true })
          },
          (error) => console.log("Failed to measure", error)
        )
      }, 100)
    }
  }

  const renderCategoryTabs = () => {
    return (
      <View style={styles.categoryTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContainer}
        >
          {Object.keys(restaurantData.Tags).map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryTab, activeCategory === category && styles.activeCategoryTab]}
              onPress={() => scrollToCategory(category)}
            >
              <Text style={[styles.categoryTabText, activeCategory === category && styles.activeCategoryTabText]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  const renderMenuItems = () => {
    return Object.entries(restaurantData.Tags).map(([category, data], index) => (
      <View 
        key={category}
        style={styles.categorySection}
        ref={ref => sectionRefs.current[category] = ref}
        onLayout={() => {
          // This helps ensure refs are properly set
          if (!sectionRefs.current[category]) {
            sectionRefs.current[category] = ref;
          }
        }}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            <Text style={styles.categoryIcon}>{data.Icon.Text}</Text>
          </View>
          
          <Text style={styles.categoryTitle}>{category}</Text>
          <Text style={styles.itemCount}>{data.Types.length} items</Text>
        </View>
        
        <View style={styles.menuItemsList}>
          {data.Types.map((item, idx) => (
            <View key={`${category}-${item}-${idx}`} style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemName}>{item}</Text>
                <View style={styles.menuItemPrice}>
                  <Text style={styles.menuItemCurrency}>৳ </Text>
                  <Text style={styles.menuItemPriceValue}>
                    {data.Price && data.Price[idx] ? data.Price[idx] : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    ))
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Fixed Header with Restaurant Image - No scroll effects */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowFullImage(!showFullImage)}>
          <ImageBackground 
            source={{ uri: restaurantData?.image }} 
            style={styles.headerImage} 
            resizeMode="cover"
          >
            <View style={styles.headerOverlay} />

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>


            {/* Restaurant Info */}
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName} numberOfLines={2}>{restaurantData.Name}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#FFF" />
                <Text style={styles.locationText} numberOfLines={1}>{restaurantData.Location}</Text>
              </View>

              {/* Rating and Price Level */}
              <View style={styles.ratingContainer}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>4.5</Text>
                </View>
                
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>Restaurant</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>

      {/* Category Tabs */}
      {renderCategoryTabs()}

      {/* Menu Items by Category */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        ref={mainScrollViewRef}
        scrollEventThrottle={16}
        contentContainerStyle={styles.menuContentContainer}
        removeClippedSubviews={true} // Performance optimization
      >
        {renderMenuItems()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {/* <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="call" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]} onPress={goback}>
          <Ionicons name="navigate" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="share-social" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View> */}
      <TouchableOpacity
      style={{
        position: "absolute",
        bottom: 20,
        left: '',
        right: 20,
        height: 60,
        width: 60,
        borderRadius: 25,
        backgroundColor: "#FD366E",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        
      }}
      onPress={goback}
      
      >
      <Ionicons name="navigate" size={30} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    width: "100%",
    height: 250,
    overflow: "hidden",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10, // Ensure header stays on top
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mapsButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapsIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  restaurantInfo: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: '90%',
  },
  locationText: {
    fontSize: 16,
    color: "#FFF",
    marginLeft: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 4,
  },
  ratingText: {
    color: "#FFF",
    marginLeft: 4,
    fontWeight: "bold",
  },
  priceBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 4,
  },
  priceText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  categoryBadge: {
    backgroundColor: "rgba(253,54,110,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  categoryText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  categoryTabsWrapper: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    zIndex: 5,
  },
  categoryTabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeCategoryTab: {
    backgroundColor: "#FD366E",
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  activeCategoryTabText: {
    color: "#FFF",
  },
  menuContainer: {
    flex: 1,
  },
  menuContentContainer: {
    paddingHorizontal: 16,
  },
  categorySection: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  categoryHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  itemCount: {
    fontSize: 13,
    color: "#666",
  },
  menuItemsList: {
    padding: 16,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  menuItemPrice: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemCurrency: {
    fontSize: 14,
    color: "#FD366E",
    fontWeight: "bold",
  },
  menuItemPriceValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FD366E",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10, // Ensure bottom bar stays on top
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#4c669f",
  },
  primaryActionButton: {
    backgroundColor: "#FD366E",
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 6,
  },
  bottomPadding: {
    height: 100,
  },
})

export default MenuScreen