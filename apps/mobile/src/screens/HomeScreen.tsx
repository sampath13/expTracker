import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCameraPermission } from '@hooks/useCameraPermission';

export default function HomeScreen() {
  const { status, request, openSettings } = useCameraPermission();

  const getStatusColor = () => {
    switch (status) {
      case 'granted': return '#4CAF50';
      case 'denied': return '#FF9800';
      case 'blocked': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const handleTestCamera = () => {
    Alert.alert('Camera', 'Camera opened');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.statusText}>
        Camera Permission: <Text style={{ color: getStatusColor() }}>{status}</Text>
      </Text>
      {status === 'denied' && (
        <TouchableOpacity style={styles.button} onPress={request}>
          <Text style={styles.buttonText}>Request Camera Permission</Text>
        </TouchableOpacity>
      )}
      {status === 'blocked' && (
        <TouchableOpacity style={styles.button} onPress={openSettings}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      )}
      <View style={styles.divider} />
      <TouchableOpacity style={styles.testCameraButton} onPress={handleTestCamera}>
        <Text style={styles.buttonText}>Test Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  statusText: { fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#ccc', width: '60%', marginVertical: 24 },
  testCameraButton: { backgroundColor: '#34C759', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
});
