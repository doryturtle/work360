import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '../../../components/Button';
import { VoiceRecorder } from '../../../components/VoiceNote';
import { addMedia, getActivity, listFindings, listFollowUps, saveWrapUp } from '../../../db/repo';
import { extensionOf, keepFile } from '../../../lib/files';
import { ui } from '../../../lib/theme';
import type { FindingKind } from '../../../lib/types';

const FIELDS: { kind: FindingKind; label: string; placeholder: string }[] = [
  { kind: 'hasil', label: 'Hasil / temuan', placeholder: 'Satu baris satu butir' },
  { kind: 'kesimpulan', label: 'Kesimpulan', placeholder: 'Satu baris satu butir' },
  { kind: 'rekomendasi', label: 'Saran dan rekomendasi', placeholder: 'Satu baris satu butir' },
];

export default function SelesaikanKegiatan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [notes, setNotes] = useState('');
  const [findings, setFindings] = useState<Record<FindingKind, string>>({
    hasil: '',
    kesimpulan: '',
    rekomendasi: '',
  });
  const [followUps, setFollowUps] = useState('');
  const [added, setAdded] = useState({ photos: 0, voices: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [activity, existing, fus] = await Promise.all([
        getActivity(db, id),
        listFindings(db, id),
        listFollowUps(db, id),
      ]);
      setNotes(activity?.notes ?? '');
      const join = (kind: FindingKind) =>
        existing
          .filter((f) => f.kind === kind)
          .map((f) => f.text)
          .join('\n');
      setFindings({ hasil: join('hasil'), kesimpulan: join('kesimpulan'), rekomendasi: join('rekomendasi') });
      setFollowUps(
        fus
          .filter((f) => !f.done)
          .map((f) => f.text)
          .join('\n'),
      );
    })();
  }, [db, id]);

  const addPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = await keepFile(asset.uri, id, `foto.${extensionOf(asset.uri, 'jpg')}`);
    await addMedia(db, { activityId: id, kind: 'photo', localUri: uri });
    setAdded((a) => ({ ...a, photos: a.photos + 1 }));
  };

  const saveVoice = async (tempUri: string, durationMs: number) => {
    const uri = await keepFile(tempUri, id, `suara.${extensionOf(tempUri, 'm4a')}`);
    await addMedia(db, { activityId: id, kind: 'voice', localUri: uri, durationMs });
    setAdded((a) => ({ ...a, voices: a.voices + 1 }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveWrapUp(db, id, { notes, findings, followUps });
      router.back();
    } catch (e) {
      Alert.alert('Gagal menyimpan', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Text style={ui.h1}>Apa hasil kegiatan?</Text>

      <VoiceRecorder onSaved={saveVoice} />
      <Button label="📷 Tambah foto" onPress={addPhoto} />
      {(added.photos > 0 || added.voices > 0) && (
        <Text style={ui.muted}>
          Tersimpan: {added.voices} catatan suara, {added.photos} foto.
        </Text>
      )}

      <View style={{ gap: 6 }}>
        <Text style={ui.label}>📝 Catatan</Text>
        <TextInput
          style={[ui.input, ui.multiline]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Catatan bebas tentang jalannya kegiatan"
        />
      </View>

      {FIELDS.map((f) => (
        <View key={f.kind} style={{ gap: 6 }}>
          <Text style={ui.label}>{f.label}</Text>
          <TextInput
            style={[ui.input, ui.multiline]}
            value={findings[f.kind]}
            onChangeText={(text) => setFindings((prev) => ({ ...prev, [f.kind]: text }))}
            multiline
            placeholder={f.placeholder}
          />
        </View>
      ))}

      <View style={{ gap: 6 }}>
        <Text style={ui.label}>Follow-up</Text>
        <TextInput
          style={[ui.input, ui.multiline]}
          value={followUps}
          onChangeText={setFollowUps}
          multiline
          placeholder="Satu baris satu tindak lanjut"
        />
      </View>

      <Button variant="primary" label={saving ? 'Menyimpan…' : 'SIMPAN'} onPress={save} disabled={saving} />
    </ScrollView>
  );
}
