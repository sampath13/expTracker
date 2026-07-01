import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import ScanReceiptScreen from '../screens/ScanReceiptScreen';
import ConfirmOcrScreen from '../screens/ConfirmOcrScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={WelcomeScreen} />
      <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
      <Stack.Screen name="ConfirmOCR" component={ConfirmOcrScreen} />
    </Stack.Navigator>
  );
}

export default HomeStack;
