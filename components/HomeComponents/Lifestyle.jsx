import { View, Text } from 'react-native'
import React from 'react'

const Lifestyle = ({
  isDarkMode,
  item,
  icon,
  COLORS

}) => {
  return (
    <View
    style={{
      borderWidth:2,
      borderColor:isDarkMode?'#353535':'#A7A7A7',
      borderRadius:15,
      height:70,
      marginBottom:10,
      paddingHorizontal:10,
      backgroundColor:isDarkMode?'#09090B':'#D9D9D9',
      flexDirection:'row',
      marginRight:10
    }}
    >
      <View style={{
        height:50,
        width:50,
        backgroundColor:isDarkMode?'#1A1A1A':'#C5C5C5',
        borderRadius:15,
        marginVertical:'auto',
        alignItems:'center',
        justifyContent:'center'


      }}>
        {icon}
      </View>
      <View
      style={{
       paddingVertical:10,
       paddingHorizontal:10,
      }}
      >
        <Text style={{fontSize:16,color: isDarkMode ? COLORS.dark.text : COLORS.light.text,fontFamily:'Outfit-Regular'}}>{item.Name}</Text>
        <Text style={{fontSize:14,color: isDarkMode ? "#8F8F8F" : "#4F4F4F",fontFamily:'Outfit-Regular'}}>{item.Location}</Text>
      </View>
    </View>
  )
}

export default Lifestyle
