import { View, Text, Image } from 'react-native'
import React from 'react'

const TourismPlaces = ({
    item,
    isDarkMode,
    COLORS
}) => {
  return (
    <View
    style={{
        borderRadius: 10,
        marginRight: 15,

    }}
    >
            <Image
                source={{ uri: item.image }}
                style={{ width: 110, height: 110,borderRadius:10 }}
                resizeMode="cover"
            />
            <Text
                style={{
                    fontSize: 15,
                    color: isDarkMode ? COLORS.dark.text : COLORS.light.text,
                    marginTop: 5,
                    textAlign: 'flex-start',
                    fontFamily: 'Outfit-Medium',
                }}
            >
                {item?.name.length > 10 ? `${item?.name.substring(0, 10)}...` : item?.name}
            </Text>
            <Text
                style={{
                    fontSize: 13,
                    color: isDarkMode ? "#8F8F8F" : "#4F4F4F",
                    marginBottom: 5,
                    textAlign: 'flex-start',
                    fontFamily: 'Outfit-Regular',
                }}
            >

                {item?.location.length > 15 ? `${item?.location.substring(0, 15)}...` : item?.location}
            </Text>
      
    </View>
  )
}

export default TourismPlaces