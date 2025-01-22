import React, { useState, useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'

const useTypingEffect = (text, typingSpeed = 50, initialDelay = 0) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
        Animated.timing(opacity, {
          toValue: 1,
          duration: typingSpeed,
          useNativeDriver: true,
        }).start()
      }
    }, currentIndex === 0 ? initialDelay : typingSpeed)

    return () => clearTimeout(timeout)
  }, [currentIndex, initialDelay, opacity, text, typingSpeed])

  return { displayedText, opacity }
}

const TypingText = ({ text, typingSpeed = 50, initialDelay = 0, style = {} }) => {
  const { displayedText, opacity } = useTypingEffect(text, typingSpeed, initialDelay)

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, style, { opacity }]}>
        {displayedText}
      </Animated.Text>
      <Animated.View style={[styles.cursor, { opacity: opacity.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0]
      }) }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#000',
  },
  cursor: {
    width: 2,
    height: 24,
    backgroundColor: '#333',
    marginLeft: 2,
  },
})

export default TypingText;