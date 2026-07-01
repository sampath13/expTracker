import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '@constants/colors';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  description: string;
  required?: boolean;
}

export function ConsentCheckbox({
  checked, onToggle, label, description, required,
}: ConsentCheckboxProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </TouchableOpacity>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  box: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: '700' },
  label: { fontSize: 14, color: colors.text, flex: 1 },
  required: { color: colors.error },
  description: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginLeft: 32 },
});
