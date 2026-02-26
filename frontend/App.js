// frontend/App.js
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './context/AppContext';
import DashboardScreen from './screens/DashboardScreen';
import DailyEntryScreen from './screens/DailyEntryScreen';
import HistoryScreen from './screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (name, focused) => {
  const icons = { Dashboard: focused ? '🏠' : '🏡', Entry: focused ? '✏️' : '📝', History: focused ? '📚' : '📖' };
  return <Text style={{ fontSize: 20 }}>{icons[name]}</Text>;
};

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: { borderTopColor: '#F3F4F6', backgroundColor: '#fff', paddingBottom: 6, paddingTop: 4, height: 60 },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
            headerStyle: { backgroundColor: '#fff', borderBottomColor: '#F3F4F6', borderBottomWidth: 1, elevation: 0, shadowColor: 'transparent' },
            headerTintColor: '#111827',
            headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerTitle: '🛢️ Tank Manager' }} />
          <Tab.Screen name="Entry" component={DailyEntryScreen} options={{ title: 'Daily Entry', headerTitle: '📝 Daily Entry' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ headerTitle: '📚 History' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
