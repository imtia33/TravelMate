import React, { useState } from "react";
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { images } from "../../constants";
import { CustomButton, FormField, ThemeToggleButton } from "../../components";
import { getCurrentUser, signIn, sendMail, checklastrecoveryMail } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTheme } from "../../context/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/theme";

const SignIn = () => {
  const { setUser, setIsLogged } = useGlobalContext();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(false);

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
      color: '#5E61EE' // Keeping red for the signup link
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
    <SafeAreaView style={themedStyles.container}>
      <ScrollView>
        <View style={{position:'absolute', alignSelf:'flex-end'}}>
          <ThemeToggleButton />
        </View>
        <View style={themedStyles.innerContainer}>
          <View >
            <Text style={[themedStyles.title, { bottom: 50 }]}>TravX</Text>
            
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
          <View style={{ justifyContent: 'flex-end', flexDirection: 'row' }}>
            <TouchableOpacity onPress={handleForgotPassword}
            disabled={forgotPasswordCooldown}
            >
              <Text style={themedStyles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{ justifyContent: 'center', paddingTop: 12, flexDirection: 'row', gap: 8 }}
          >
          <CustomButton
           
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />
          </View>
          
          <View style={{ justifyContent: 'center', paddingTop: 12, flexDirection: 'row', gap: 8 }}>
            <Text style={themedStyles.signupText}>
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              style={themedStyles.signupLink}
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