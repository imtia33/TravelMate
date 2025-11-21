import React, { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { View, Text, ScrollView, Dimensions, Alert, Image, StyleSheet, BackHandler } from "react-native";
import { images } from "../../constants";
import { createUser, getDistricts } from "../../lib/appwrite";
import { CustomButton, FormField, ModernDropdown } from "../../components"; // Use ModernDropdown instead
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTheme } from "../../context/ThemeProvider"; // Import useTheme
import { COLORS } from "../../constants/theme"; // Import COLORS
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeToggleButton } from "../../components"; // Import ThemeToggleButton

const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const { isDarkMode } = useTheme(); // Get theme context
  const router = useRouter();
  
  useEffect(() => {
    GetDistricts();
    
    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => backHandler.remove();
  }, []);
  
  const handleBackPress = () => {
    router.push('/sign-in');
    return true;
  };
  
  const [isSubmitting, setSubmitting] = useState(false);
  const [locationData, setLocationData] = useState([]); 
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    number: "",
    location: "",
    bloodtype: "",
    retypepassword: "",
    Lat: null,
    Long: null,
    bbox:""
  });

  // Define themed styles using global colors
  const themedStyles = StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? COLORS.dark.background : COLORS.light.background,
      height: '100%'
    },
    innerContainer: {
      width: '100%',
      justifyContent: 'center',
      height: '100%',
      paddingHorizontal: 16,
      marginVertical: 24,
      minHeight: Dimensions.get("window").height - 100,
    },
    title: {
      fontSize: 50,
      fontFamily: 'Kode-mono',
      alignSelf: 'center',
      color: isDarkMode ? COLORS.dark.text : COLORS.light.text
    },
    linkText: {
      fontSize: 18,
      fontFamily: 'Outfit-Medium',
      color: isDarkMode ? COLORS.dark.primary : COLORS.light.primary
    },
    signupText: {
      fontSize: 18,
      fontFamily: 'Outfit-Medium',
      color: isDarkMode ? COLORS.dark.text : COLORS.light.text
    },
    signupLink: {
      fontSize: 18,
      fontFamily: 'Outfit-Medium',
      color: '#5E61EE' // Using same color as sign-in
    },
    forgotPasswordText: {
      fontFamily: 'Outfit-Regular',
      color: isDarkMode ? COLORS.dark.text : COLORS.light.text,
      opacity: 0.9,
      alignSelf: 'center',
      fontSize:15,
      marginBottom:10
    }
  });

  const GetDistricts = async () => {
    const locations = await getDistricts();
    setLocationData(locations);
  };

  const submit = async () => {
    if (form.username === "" || form.email === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (form.password !== form.retypepassword) {
      Alert.alert("Error", "Please make sure your password is the same");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUser(form.email, form.password, form.username, form.location, form.Lat, form.Long,form.bbox);
      setUser(result);
      setIsLogged(true);
      router.replace("/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={themedStyles.container}>
      <ScrollView>
        <View style={{position:'absolute', alignSelf:'flex-end'}}>
          <ThemeToggleButton />
        </View>
        <View style={themedStyles.innerContainer}>
          <View >
            <Text style={[themedStyles.title, { marginBottom: 10 }]}>TravX</Text>
          </View>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-2"
            placeholder="Your Name"
          />
          <View style={{ marginTop: 0, marginBottom: 5, flexDirection: "row", width: '99%', alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 19, 
              marginBottom: 5, 
              color: isDarkMode ? COLORS.dark.text : COLORS.light.text, 
              fontFamily: 'Outfit-Medium', 
              alignSelf: 'center', 
              marginRight: 10
            }}>Location:</Text>
            <ModernDropdown
              data={locationData}
              value={form.location}
              onChange={(value, Lat, Long,bbox) => setForm({ ...form, location: value, Lat, Long,bbox })}
              placeholder="Location"
            />
          </View>
          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-2"
            keyboardType="email-address"
            placeholder="example@email.com"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-2"
            placeholder="Password"
          />
          <FormField
            title="Retype password"
            value={form.retypepassword}
            handleChangeText={(e) => setForm({ ...form, retypepassword: e })}
            otherStyles="mt-2"
            placeholder="Retype same Password"
          />

          <View
            style={{ justifyContent: 'center', paddingTop: 12, flexDirection: 'row', gap: 8 }}
          >
          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />
          </View>

          <View style={{ justifyContent: 'center', paddingTop: 12, flexDirection: 'row', gap: 8 }}>
            <Text style={themedStyles.signupText}>
              Have an account already?
            </Text>
            <Link
              href="/sign-in"
              style={themedStyles.signupLink}
            >
              Login
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;