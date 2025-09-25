import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '@/constants';

// Import screens (will be created next)
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';

const Stack = createStackNavigator();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'ログイン' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: '新規登録' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;