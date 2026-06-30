import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function ExpenseListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Expenses</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
});

export default ExpenseListScreen;
