import React, { useState } from "react";
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { getCurrentUser, signIn, sendMail } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { SafeAreaView } from "react-native-safe-area-context";

const SignIn = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async () => {
    if (form.email === "" || form.password === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all fields",
        position: "top",
      });
      return;
    }

    setSubmitting(true);

    try {
      await signIn(form.email, form.password);
      const result = await getCurrentUser();
      
      setUser(result);
      setIsLogged(true);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User signed in successfully",
        position: "top",
      });
      router.replace("/home");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
        position: "top",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const { email } = form;

    if (!email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter your email",
        position: "top",
      });
      return;
    } else {
      try {
        await sendMail(email);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
          position: "top",
        });
      }
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
            marginVertical: 24,
            minHeight: Dimensions.get("window").height - 100,
          }}
        >
          <Image
            source={images.logo}
            resizeMode="contain"
            style={{ width: 250, height: 160, alignSelf: 'center', marginBottom: 24 }}
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-2"
            keyboardType="email-address"
            placeholder={"example@email.com"}
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-2"
            placeholder={"Password"}
          />

          <CustomButton
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View style={{ justifyContent: 'center', paddingTop: 12, flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={{ fontFamily: 'psemibold', color: '#1E90FF', alignSelf: 'center' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ justifyContent: 'center', paddingTop: 12, flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 18, fontFamily: 'psemibold' }}>
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              style={{ fontSize: 18, fontFamily: 'psemibold', color: '#FF0000' }}
            >
              Signup
            </Link>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default SignIn;
