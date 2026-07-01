import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@components/Button';
import { useAuthStore } from '@store';
import colors from '@constants/colors';
import type { HomeStackParamList } from '@navigation/types';

type HomeNav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function WelcomeScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<HomeNav>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</Text>
        <Text style={styles.title}>ExpTracker</Text>
        <Text style={styles.subtitle}>Track spending. Find savings.</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Scans this month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>--</Text>
          <Text style={styles.statLabel}>Potential savings</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Scan a Receipt" onPress={() => navigation.navigate('ScanReceipt')} />
        <Button title="View My Expenses" onPress={() => {}} variant="outline" style={styles.secondary} />
        <Button title="Compare Prices" onPress={() => {}} variant="outline" style={styles.secondary} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {user?.tier === 'free'
            ? 'Free tier: 10 scans/month'
            : 'Premium tier: unlimited scans'}
        </Text>
        <Button title="Sign Out" onPress={logout} variant="outline" style={styles.signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 24 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  greeting: { fontSize: 18, color: colors.textSecondary, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  actions: { gap: 12 },
  secondary: { marginTop: 0 },
  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  signOut: { width: '100%' },
});
