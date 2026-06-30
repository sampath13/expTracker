import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import type { HomeStackParamList } from './types';

function ScanReceiptScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Scan Receipt</Text>
    </View>
  );
}

function ConfirmOCRScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Confirm OCR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
  },
});

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
      <Stack.Screen name="ConfirmOCR" component={ConfirmOCRScreen} />
    </Stack.Navigator>
  );
}

export default HomeStack;
