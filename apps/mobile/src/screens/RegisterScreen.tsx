import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { ConsentCheckbox } from '@components/ConsentCheckbox';
import { useAuthStore } from '@store';
import colors from '@constants/colors';
import type { AuthStackParamList } from '@navigation/types';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const { register, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [communityContribution, setCommunityContribution] = useState(true);
  const [pdpaConsent, setPdpaConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email is required';
    if (!password.trim()) errors.password = 'Password is required';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!mobile.trim()) errors.mobile = 'Mobile number is required';
    if (!pdpaConsent) errors.pdpa = 'You must agree to continue';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    clearError();
    setSubmitting(true);
    try {
      await register(email.trim(), password, mobile.trim(), communityContribution);
      Alert.alert('Success', 'Account created! Please sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch {
      // error is set in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start tracking your grocery expenses</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
          error={fieldErrors.email}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          error={fieldErrors.password}
        />

        <Input
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="+65 9123 4567"
          error={fieldErrors.mobile}
        />

        <View style={styles.consentSection}>
          <ConsentCheckbox
            checked={pdpaConsent}
            onToggle={() => setPdpaConsent(!pdpaConsent)}
            label="I agree to my expense data being stored for personal tracking"
            description="Your bill data is stored securely and used only for your personal expense tracking."
            required
          />
          {fieldErrors.pdpa && (
            <Text style={styles.fieldError}>{fieldErrors.pdpa}</Text>
          )}

          <ConsentCheckbox
            checked={communityContribution}
            onToggle={() => setCommunityContribution(!communityContribution)}
            label="I agree to contribute anonymised item prices to help the community"
            description="Your item prices (without any personal identifiers) help everyone find better deals. You can change this anytime in Settings."
          />
        </View>

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={submitting}
          disabled={!email.trim() || !password.trim() || !mobile.trim() || !pdpaConsent}
        />

        <View style={styles.loginLink}>
          <Button
            title="Already have an account? Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
  error: {
    fontSize: 14, color: colors.error, backgroundColor: '#FEF2F2',
    padding: 12, borderRadius: 8, marginBottom: 16,
  },
  consentSection: { marginVertical: 8 },
  fieldError: { fontSize: 12, color: colors.error, marginTop: -12, marginBottom: 8, marginLeft: 32 },
  loginLink: { marginTop: 24 },
});
