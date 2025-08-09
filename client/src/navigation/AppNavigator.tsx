import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import ChangePasswordScreen from '../screens/home/ChangePasswordScreen';
import AdminUsersScreen from '../screens/home/AdminUsersScreen';
import LearnScreen from '../screens/home/LearnScreen';
import { useAuthStore } from '../store';
import SettingsScreen from '../screens/home/SettingsScreen';
import NotFoundScreen from '../screens/home/NotFoundScreen';
import HomeScreen from '../screens/home/HomeScreen';
import LessonListScreen from '../screens/Lessons/index';
import LessonDetailScreen from '../screens/Lessons/Detail';

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
  NotFound: undefined;
  LessonList: undefined;
  LessonDetail: { id: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function Tabs({ colors }: { colors: { bg: string; text: string; active: string; inactive: string } }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.inactive + '33' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
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
      <Tab.Screen name="Home" component={HomeScreen as any} />
      <Tab.Screen name="Learn" component={LessonListScreen as any} />
      <Tab.Screen name="Profile" component={ProfileScreen as any} />
      <Tab.Screen name="Settings" component={SettingsScreen as any} />
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
  const isDark = prefs.theme === 'dark';
  const colors = {
    bg: isDark ? '#1E293B' : '#F8FAFC',
    text: isDark ? '#F8FAFC' : '#1E293B',
    active: '#2563EB',
    inactive: isDark ? '#94A3B8' : '#64748B',
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      >
        {!isAuthed ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" options={{ headerShown: false }}>
              {() => <Tabs colors={colors} />}
            </Stack.Screen>
            <Stack.Screen name="LessonList" component={LessonListScreen as any} options={{ title: 'Lessons' }} />
            <Stack.Screen name="LessonDetail" component={LessonDetailScreen as any} options={{ title: 'Lesson' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users (Admin)' }} />
          </>
        )}
        <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Not Found' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


