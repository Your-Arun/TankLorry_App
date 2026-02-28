import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StatusBar } from 'react-native';
import { AppProvider } from './context/AppContext';
import DashboardScreen  from './screens/DashboardScreen';
import DailyEntryScreen from './screens/DailyEntryScreen';
import HistoryScreen    from './screens/HistoryScreen';
import SettingsScreen   from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => {
              const icons = {
                Dashboard:   '🏠',
                'Daily Entry': '✏️',
                History:     '📋',
                Settings:    '⚙️',
              };
              return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[route.name]}</Text>;
            },
            tabBarActiveTintColor:   '#3B82F6',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle:             { paddingBottom: 8, paddingTop: 6, height: 60, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
            tabBarLabelStyle:        { fontSize: 11, fontWeight: '700' },
            headerStyle:             { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
            headerTitleStyle:        { fontWeight: '800', fontSize: 17, color: '#111827' },
          })}
        >
          <Tab.Screen name="Dashboard"   component={DashboardScreen}  options={{ title: 'Dashboard' }} />
          <Tab.Screen name="Daily Entry" component={DailyEntryScreen} options={{ title: 'Aaj Ki Entry' }} />
          <Tab.Screen name="History"     component={HistoryScreen}    options={{ title: 'History' }} />
          <Tab.Screen name="Settings"    component={SettingsScreen}   options={{ title: 'Sale Rates' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
