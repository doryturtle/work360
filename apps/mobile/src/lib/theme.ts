import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#F5F6F8',
  card: '#FFFFFF',
  text: '#1B1F24',
  muted: '#667085',
  border: '#E4E7EC',
  primary: '#0B6BCB',
  primaryText: '#FFFFFF',
  danger: '#C62828',
  warn: '#B26A00',
  ok: '#2E7D32',
};

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
