import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { Card, Button } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      '本当にログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => dispatch(logoutUser()),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.displayName}>{user?.displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.totalPoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>総ポイント</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.lifetimeSteps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>総歩数</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="settings" size={24} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>設定</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="help-circle" size={24} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>ヘルプ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="document-text" size={24} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>利用規約</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]}>
            <View style={styles.menuItemContent}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>プライバシーポリシー</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="ログアウト"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />

        {/* App Version */}
        <Text style={styles.versionText}>Walk2Point v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
    padding: SPACING.md,
  },

  profileCard: {
    marginBottom: SPACING.lg,
  },

  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },

  displayName: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  email: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },

  statLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  menuCard: {
    marginBottom: SPACING.lg,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  lastMenuItem: {
    borderBottomWidth: 0,
  },

  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuItemText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },

  logoutButton: {
    marginBottom: SPACING.xl,
  },

  versionText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 'auto',
  },
});

export default ProfileScreen;