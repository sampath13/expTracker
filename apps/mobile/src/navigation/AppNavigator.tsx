import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import ExpensesStack from './ExpensesStack';
import CompareStack from './CompareStack';
import SettingsStack from './SettingsStack';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  HomeTab: 'Home',
  ExpensesTab: 'Expenses',
  CompareTab: 'Compare',
  SettingsTab: 'Settings',
};

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: TAB_LABELS[route.name],
      })}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="ExpensesTab" component={ExpensesStack} />
      <Tab.Screen name="CompareTab" component={CompareStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
}

export default AppNavigator;
