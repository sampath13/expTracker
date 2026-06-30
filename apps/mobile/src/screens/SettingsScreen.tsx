import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
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

export default SettingsScreen;
