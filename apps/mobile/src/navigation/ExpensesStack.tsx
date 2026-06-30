import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import type { ExpensesStackParamList } from './types';

function BillDetailScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>Bill Detail</Text>
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

const Stack = createNativeStackNavigator<ExpensesStackParamList>();

function ExpensesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
    </Stack.Navigator>
  );
}

export default ExpensesStack;
