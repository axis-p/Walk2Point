import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '@/store';
import { registerUser, clearError } from '@/store/slices/authSlice';
import { Button, Input, LoadingSpinner, ErrorMessage } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY, VALIDATION } from '@/constants';
import { RegisterForm } from '@/types';

const RegisterScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = '表示名は必須です';
    } else if (formData.displayName.trim().length < VALIDATION.DISPLAY_NAME_MIN_LENGTH) {
      newErrors.displayName = `表示名は${VALIDATION.DISPLAY_NAME_MIN_LENGTH}文字以上で入力してください`;
    } else if (formData.displayName.trim().length > VALIDATION.DISPLAY_NAME_MAX_LENGTH) {
      newErrors.displayName = `表示名は${VALIDATION.DISPLAY_NAME_MAX_LENGTH}文字以下で入力してください`;
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'パスワードは大文字、小文字、数字を含む必要があります';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認は必須です';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      Alert.alert('利用規約', '利用規約とプライバシーポリシーに同意してください。');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(registerUser(formData)).unwrap();
      // Navigation will be handled by AppNavigator based on auth state
    } catch (registerError) {
      // Error is handled by the slice
      console.error('Registration failed:', registerError);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  const handleInputChange = (field: keyof RegisterForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (field !== 'acceptTerms' && errors[field]) {
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

  const showTermsAndPrivacy = () => {
    Alert.alert(
      '利用規約とプライバシーポリシー',
      'アプリ内でWalk2Pointの利用規約とプライバシーポリシーをご確認いただけます。',
      [{ text: 'OK' }]
    );
  };

  const getPasswordStrengthColor = (password: string): string => {
    if (password.length === 0) return COLORS.border;
    if (password.length < 6) return COLORS.error;
    if (password.length < 8) return COLORS.warning;
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return COLORS.warning;
    return COLORS.success;
  };

  const getPasswordStrengthText = (password: string): string => {
    if (password.length === 0) return '';
    if (password.length < 6) return '弱い';
    if (password.length < 8) return '普通';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return '普通';
    return '強い';
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
                name="person-add"
                size={50}
                color={COLORS.primary}
              />
              <Text style={styles.logoText}>アカウント作成</Text>
            </View>
            <Text style={styles.subtitle}>
              Walk2Pointに参加して、健康的な生活を始めよう
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
              label="表示名"
              placeholder="山田太郎"
              value={formData.displayName}
              onChangeText={(value) => handleInputChange('displayName', value)}
              error={errors.displayName}
              maxLength={VALIDATION.DISPLAY_NAME_MAX_LENGTH}
              leftIcon="person"
            />

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

            <View>
              <Input
                label="パスワード"
                placeholder="8文字以上の安全なパスワード"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                onFocus={() => setShowPasswordHint(true)}
                onBlur={() => setShowPasswordHint(false)}
                error={errors.password}
                secureTextEntry
                leftIcon="lock-closed"
              />

              {showPasswordHint && formData.password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View
                    style={[
                      styles.strengthIndicator,
                      { backgroundColor: getPasswordStrengthColor(formData.password) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.strengthText,
                      { color: getPasswordStrengthColor(formData.password) },
                    ]}
                  >
                    パスワード強度: {getPasswordStrengthText(formData.password)}
                  </Text>
                </View>
              )}
            </View>

            <Input
              label="パスワード確認"
              placeholder="パスワードを再入力"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              error={errors.confirmPassword}
              secureTextEntry
              leftIcon="lock-closed"
            />

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => handleInputChange('acceptTerms', !formData.acceptTerms)}
            >
              <Ionicons
                name={formData.acceptTerms ? 'checkbox' : 'square-outline'}
                size={20}
                color={formData.acceptTerms ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={styles.termsText}>
                <Text style={styles.linkText} onPress={showTermsAndPrivacy}>
                  利用規約
                </Text>
                および
                <Text style={styles.linkText} onPress={showTermsAndPrivacy}>
                  プライバシーポリシー
                </Text>
                に同意します
              </Text>
            </TouchableOpacity>

            <Button
              title="アカウント作成"
              onPress={handleRegister}
              loading={isLoading}
              disabled={!formData.acceptTerms}
              style={styles.registerButton}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                すでにアカウントをお持ちの方は
              </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLinkText}>ログイン</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>パスワード要件:</Text>
            <View style={styles.requirementsList}>
              <Text style={styles.requirementText}>• 8文字以上</Text>
              <Text style={styles.requirementText}>• 大文字と小文字を含む</Text>
              <Text style={styles.requirementText}>• 数字を含む</Text>
            </View>
          </View>
        </ScrollView>

        {isLoading && (
          <LoadingSpinner
            message="アカウント作成中..."
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
    paddingVertical: SPACING.lg,
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  logoText: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },

  form: {
    flex: 1,
    marginBottom: SPACING.lg,
  },

  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },

  strengthIndicator: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },

  strengthText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  termsText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },

  linkText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  registerButton: {
    marginBottom: SPACING.lg,
  },

  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },

  loginPromptText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },

  loginLinkText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    textDecorationLine: 'underline',
  },

  requirements: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },

  requirementsTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  requirementsList: {
    marginTop: SPACING.xs,
  },

  requirementText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});

export default RegisterScreen;