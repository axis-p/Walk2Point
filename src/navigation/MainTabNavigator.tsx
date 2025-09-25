import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SCREEN_NAMES, TAB_ICONS } from '@/constants';

// Import screens (will be created next)
import DashboardScreen from '@/screens/DashboardScreen';
import PointsScreen from '@/screens/PointsScreen';
import RedeemScreen from '@/screens/RedeemScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case SCREEN_NAMES.DASHBOARD:
              iconName = focused ? 'home' : 'home-outline';
              break;
            case SCREEN_NAMES.POINTS:
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case SCREEN_NAMES.REDEEM:
              iconName = focused ? 'gift' : 'gift-outline';
              break;
            case SCREEN_NAMES.PROFILE:
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name={SCREEN_NAMES.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'ホーム',
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.POINTS}
        component={PointsScreen}
        options={{
          title: 'ポイント',
          tabBarLabel: 'ポイント',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.REDEEM}
        component={RedeemScreen}
        options={{
          title: '交換',
          tabBarLabel: '交換',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'プロフィール',
          tabBarLabel: 'プロフィール',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;