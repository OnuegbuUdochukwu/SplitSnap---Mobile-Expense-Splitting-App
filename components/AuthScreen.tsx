import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthScreenProps {
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => void;
  onEmailSignUp: (email: string, password: string, fullName: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function AuthScreen({
  onGoogleSignIn,
  onAppleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  loading = false,
  error,
}: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailAuth = () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) return;
      onEmailSignUp(email.trim(), password, fullName.trim());
    } else {
      onEmailSignIn(email.trim(), password);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setIsSignUp(false);
    setShowEmailForm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoText}>💸</Text>
                </View>
                <Text style={styles.appName}>SplitSnap</Text>
                <Text style={styles.tagline}>
                  Split bills instantly with friends
                </Text>
              </View>

              {!showEmailForm ? (
                <>
                  <View style={styles.features}>
                    <FeatureItem
                      icon="📸"
                      text="Scan receipts with AI-powered OCR"
                    />
                    <FeatureItem
                      icon="⚡"
                      text="Real-time collaborative splitting"
                    />
                    <FeatureItem icon="💳" text="Secure in-app payments" />
                    <FeatureItem
                      icon="👥"
                      text="Track group expenses over time"
                    />
                  </View>

                  <View style={styles.authButtons}>
                    <TouchableOpacity
                      style={[styles.oauthButton, styles.googleButton]}
                      onPress={onGoogleSignIn}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <Text style={styles.googleIcon}>🔐</Text>
                      <Text style={styles.googleText}>
                        Continue with Google
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.oauthButton, styles.appleButton]}
                      onPress={onAppleSignIn}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <Text style={styles.appleIcon}>🍎</Text>
                      <Text style={styles.appleText}>Continue with Apple</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.emailButton}
                      onPress={() => setShowEmailForm(true)}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <Text style={styles.emailButtonText}>
                        Continue with Email
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                      By continuing, you agree to our Terms of Service and
                      Privacy Policy
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emailForm}>
                  <View style={styles.formHeader}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={resetForm}
                    >
                      <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.formTitle}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                  </View>

                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    {isSignUp && (
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoComplete="name"
                      />
                    )}

                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete={
                        isSignUp ? 'new-password' : 'current-password'
                      }
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      loading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleEmailAuth}
                    disabled={
                      loading ||
                      !email.trim() ||
                      !password.trim() ||
                      (isSignUp && !fullName.trim())
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading
                        ? 'Please wait...'
                        : isSignUp
                        ? 'Create Account'
                        : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  {isSignUp && (
                    <Text style={styles.signUpNote}>
                      After creating your account, you may need to wait a moment for your profile to be set up.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.switchModeButton}
                    onPress={() => setIsSignUp(!isSignUp)}
                    disabled={loading}
                  >
                    <Text style={styles.switchModeText}>
                      {isSignUp
                        ? 'Already have an account? Sign In'
                        : "Don't have an account? Sign Up"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  features: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  authButtons: {
    gap: 16,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  appleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  emailButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
  emailForm: {
    flex: 1,
    justifyContent: 'center',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FEF2F2',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  signUpNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
