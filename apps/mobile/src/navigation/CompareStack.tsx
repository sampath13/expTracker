import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CompareScreen from '../screens/CompareScreen';
import type { CompareStackParamList } from './types';

function ItemDetailScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Item Detail</Text>
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

const Stack = createNativeStackNavigator<CompareStackParamList>();

function CompareStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CompareHome" component={CompareScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </Stack.Navigator>
  );
}

export default CompareStack;
