import React, { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { View, Text, ScrollView, Dimensions, Alert, Image } from "react-native";

import { images } from "../../constants";
import { createUser, getDistricts } from "../../lib/appwrite";
import { CustomButton, FormField, CustomDropdown } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const router = useRouter();
  
  useEffect(() => {
    GetDistricts();
  }, []);
  
  const [isSubmitting, setSubmitting] = useState(false);
  const [locationData, setLocationData] = useState([]);  // represent districts
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
    <SafeAreaView style={{ backgroundColor: '#d1d9ed', height: '100%' }}>
      <ScrollView>
        <View
          style={{
            width: '100%',
            justifyContent: 'center',
            height: '100%',
            paddingHorizontal: 16,
            marginBottom: 24,
            marginTop: 12,
            minHeight: Dimensions.get("window").height - 100,
          }}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center',left:'10%' }}
          >
            
            <Text style={{ fontFamily: 'MS', fontSize: 106,width: 140,height: 140,bottom:15}}>T</Text>
            <Text style={{ fontFamily: 'CV', fontSize: 58,width:80,right:50 }}>rav</Text>
            <Text style={{ fontFamily: 'DS', fontSize: 106,right:70,bottom:15 }}>X</Text>
          </View>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles={{ marginTop: 8 }}
            placeholder="Your Name"
          />
          <View style={{ marginTop: 16, marginBottom: 5, flexDirection: "row", width: '99%', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 19, marginBottom: 5, color: '#333', fontFamily: 'psemibold', alignSelf: 'center', marginTop: 8 }}>Location:</Text>
            <CustomDropdown
              data={locationData}
              value={form.location}
              onChange={(value, Lat, Long,bbox) => setForm({ ...form, location: value, Lat, Long,bbox })}
              placeholder="Select location"
            />
          </View>
          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles={{ marginTop: 8 }}
            keyboardType="email-address"
            placeholder="example@email.com"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles={{ marginTop: 8 }}
            placeholder="Password"
          />
          <FormField
            title="Retype password"
            value={form.retypepassword}
            handleChangeText={(e) => setForm({ ...form, retypepassword: e })}
            otherStyles={{ marginTop: 8 }}
            placeholder="Retype same Password"
          />

          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles={{ marginTop: 28 }}
            isLoading={isSubmitting}
          />

          <View style={{ justifyContent: 'center', paddingTop: 20, flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 18, fontFamily: 'pregular' }}>
              Have an account already?
            </Text>
            <Link
              href="/sign-in"
              style={{ fontSize: 18, fontFamily: 'psemibold', color: 'red', marginBottom: 40 }}
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
