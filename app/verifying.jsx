import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { resetPass } from '../lib/appwrite';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PasswordReset = () => {
  const params = useLocalSearchParams();
  const userId = params?.userId?.toString();
  const secret = params?.secret?.toString(); 
  const expire = params?.expire?.toString();
  const [status, setStatus] = useState('verifying');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (userId && secret && expire) {
      setStatus('ready');
    } else {
      setStatus('error');
      setMessage('Invalid reset link. Please request a new password reset.');
    }
  }, [userId, secret, expire]);

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    setStatus('resetting');
    try {
      const res = await resetPass(userId, secret, newPassword, confirmPassword);
      setStatus('success');
      setMessage("Password reset was successful. You'll be redirected to sign in page shortly.");
      setTimeout(() => router.replace('/sign-in'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to reset password. Please try again.');
    }
  };

  const renderInputField = (value, setValue, placeholder, showPassword, setShowPassword) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={setValue}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.icon}
      >
        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#4A5568" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.heading}>Password Reset</Text>
          {status === 'verifying' && <ActivityIndicator size="large" color="#4299E1" />}
          {status === 'ready' && (
            <View style={styles.formContainer}>
              {renderInputField(newPassword, setNewPassword, "New Password", showPassword, setShowPassword)}
              {renderInputField(confirmPassword, setConfirmPassword, "Confirm Password", showConfirmPassword, setShowConfirmPassword)}
              <TouchableOpacity
                style={styles.button}
                onPress={handleReset}
                disabled={status === 'resetting'}
              >
                {status === 'resetting' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {(status === 'success' || status === 'error') && (
            <Text
              style={[
                styles.message,
                status === 'error' ? styles.errorMessage : styles.successMessage,
              ]}
            >
              {message}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF8FF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#F7FAFC',
  },
  icon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  button: {
    backgroundColor: '#4299E1',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  successMessage: {
    backgroundColor: '#C6F6D5',
    color: '#2F855A',
  },
  errorMessage: {
    backgroundColor: '#FED7D7',
    color: '#9B2C2C',
  },
});

export default PasswordReset;
