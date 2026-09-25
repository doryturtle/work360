import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '../lib/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'secondary', disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        (pressed || disabled) && styles.dim,
        style,
      ]}
    >
      <Text style={[styles.text, variant !== 'secondary' && styles.textOnColor]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  dim: { opacity: 0.6 },
  text: { fontSize: 15, fontWeight: '600', color: colors.text },
  textOnColor: { color: colors.primaryText },
});
