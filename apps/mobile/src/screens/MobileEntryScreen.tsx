import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { useAuthStore } from '@store';
import colors from '@constants/colors';

export default function MobileEntryScreen() {
  const navigation = useNavigation();
  const { setMobile, error, clearError } = useAuthStore();
  const [mobile, setMobileState] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!mobile.trim()) return;
    clearError();
    setSubmitting(true);
    try {
      await setMobile(mobile.trim());
    } catch {
      // error set in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Add Your Mobile Number</Text>
        <Text style={styles.subtitle}>
          This helps us secure your account. You only need to do this once.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Input
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobileState}
          keyboardType="phone-pad"
          placeholder="+65 9123 4567"
        />

        <Button
          title="Continue"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!mobile.trim()}
        />

        <Button
          title="Skip for now"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.skip}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
  error: {
    fontSize: 14, color: colors.error, backgroundColor: '#FEF2F2',
    padding: 12, borderRadius: 8, marginBottom: 16,
  },
  skip: { marginTop: 12 },
});
