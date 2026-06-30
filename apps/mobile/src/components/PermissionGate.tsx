import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { usePermission } from '@hooks/usePermission';
import type { Permission } from 'react-native-permissions';

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function PermissionGate({
  permission,
  children,
  title = 'Permission Required',
  description = 'This feature requires a permission to continue.',
}: PermissionGateProps) {
  const { status, isLoading, request, openSettings } = usePermission(permission);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status === 'granted') {
    return <>{children}</>;
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {status === 'denied' && (
        <TouchableOpacity style={styles.button} onPress={request}>
          <Text style={styles.buttonText}>Allow Permission</Text>
        </TouchableOpacity>
      )}

      {status === 'blocked' && (
        <TouchableOpacity style={styles.button} onPress={openSettings}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      )}

      {status === 'unavailable' && (
        <Text style={styles.description}>This feature is not available on your device.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
