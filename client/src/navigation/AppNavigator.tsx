import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import ChangePasswordScreen from '../screens/home/ChangePasswordScreen';
import AdminUsersScreen from '../screens/home/AdminUsersScreen';
import LearnScreen from '../screens/home/LearnScreen';
import SettingsScreen from '../screens/home/SettingsScreen';
import NotFoundScreen from '../screens/home/NotFoundScreen';
import { useAuthStore } from '../store';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Home: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  AdminUsers: undefined;
  Tabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') icon = 'home';
          if (route.name === 'Learn') icon = 'book';
          if (route.name === 'Profile') icon = 'person';
          if (route.name === 'Settings') icon = 'settings';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const token = useAuthStore((s) => s.token);
  const prefs = useAuthStore((s) => s.preferences);
  let authed = !!token;
  if (!authed && typeof window !== 'undefined') {
    const webToken = window.localStorage?.getItem('auth_token');
    authed = !!webToken;
  }
  const isAuthed = authed;

  const theme: Theme = prefs.theme === 'dark' ? DarkTheme : prefs.theme === 'light' ? DefaultTheme : DefaultTheme;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!isAuthed ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users (Admin)' }} />
          </>
        )}
        <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Not Found' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


