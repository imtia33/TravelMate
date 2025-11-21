import React, { useState } from "react";
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { getCurrentUser, signIn, sendMail, checklastrecoveryMail } from "../../lib/appwrite";
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
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(false);

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
    if (forgotPasswordCooldown) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please wait before trying again",
        position: "top",
      });
      return;
    }

    const { email } = form;

    if (!email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter your email",
        position: "top",
      });
      return;
    }

    try {
      const check = await checklastrecoveryMail(email);
      console.log(check);

      if (check.documents.length === 0) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "User does not exist. Check your Email",
          position: "top",
        });
        setForgotPasswordCooldown(true);
        setTimeout(() => setForgotPasswordCooldown(false), 60000);
        return;
      }

      const lastTime = new Date(check.documents[0].ForgotPasswordLastTime).getTime();
      const currentTime = Date.now();

      if (currentTime - lastTime < 3600000) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please wait for an hour before trying again",
          position: "top",
        });
        setForgotPasswordCooldown(true);
        setTimeout(() => setForgotPasswordCooldown(false), 60000);
        return;
      }

      const sent = await sendMail(email, check.documents[0].$id);
      if (sent) {
        Toast.show({
          type: "success",
          text1: "Recovery email sent",
          text2: "Please wait for an email to reset your password",
          position: "top",
        });
        setForgotPasswordCooldown(true);
        setTimeout(() => setForgotPasswordCooldown(false), 60000); // 1 minute cooldown
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
        position: "top",
      });
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
          <View
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center',left:'10%' }}
          >
            
            <Text style={{ fontFamily: 'MS', fontSize: 106,width: 140,height: 140,bottom:15}}>T</Text>
            <Text style={{ fontFamily: 'CV', fontSize: 58,width:80,right:50 }}>rav</Text>
            <Text style={{ fontFamily: 'DS', fontSize: 106,right:70,bottom:15 }}>X</Text>
          </View>

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
            <TouchableOpacity onPress={handleForgotPassword}
            disabled={forgotPasswordCooldown}
            >
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