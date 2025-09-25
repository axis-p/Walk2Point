import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '@/store';
import { loginUser, clearError } from '@/store/slices/authSlice';
import { Button, Input, LoadingSpinner, ErrorMessage } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY, VALIDATION } from '@/constants';
import { LoginForm } from '@/types';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `パスワードは${VALIDATION.PASSWORD_MIN_LENGTH}文字以上で入力してください`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      // Navigation will be handled by AppNavigator based on auth state
    } catch (loginError) {
      // Error is handled by the slice
      console.error('Login failed:', loginError);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'パスワードリセット',
      'パスワードリセット機能は現在開発中です。\nサポートまでお問い合わせください。',
      [{ text: 'OK' }]
    );
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear global error
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="walk"
                size={60}
                color={COLORS.primary}
              />
              <Text style={styles.logoText}>Walk2Point</Text>
            </View>
            <Text style={styles.subtitle}>
              歩いてポイントを貯めよう
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <ErrorMessage
                message={error}
                onRetry={() => dispatch(clearError())}
                retryText="閉じる"
              />
            )}

            <Input
              label="メールアドレス"
              placeholder="email@example.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail"
            />

            <Input
              label="パスワード"
              placeholder="パスワードを入力"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={errors.password}
              secureTextEntry
              autoComplete="password"
              leftIcon="lock-closed"
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <Ionicons
                  name={rememberMe ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={rememberMe ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.rememberMeText}>ログイン状態を保持</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  パスワードを忘れた方
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="ログイン"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="新規アカウント作成"
              onPress={navigateToRegister}
              variant="outline"
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ログインすることで、
              <Text style={styles.linkText}>利用規約</Text>
              および
              <Text style={styles.linkText}>プライバシーポリシー</Text>
              に同意したものとみなします。
            </Text>
          </View>
        </ScrollView>

        {isLoading && (
          <LoadingSpinner
            message="ログイン中..."
            overlay={true}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.xl,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  logoText: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  form: {
    flex: 1,
    marginBottom: SPACING.xl,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rememberMeText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },

  forgotPasswordText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  loginButton: {
    marginBottom: SPACING.lg,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },

  registerButton: {
    marginBottom: SPACING.lg,
  },

  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
  },

  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  linkText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;