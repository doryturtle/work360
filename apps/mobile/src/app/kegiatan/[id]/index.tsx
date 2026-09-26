import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { VoicePlayer, VoiceRecorder } from '../../../components/VoiceNote';
import {
  addDocument,
  addMedia,
  addTimelineEvent,
  getActivity,
  listDocuments,
  listFindings,
  listFollowUps,
  listMedia,
  listTimeline,
} from '../../../db/repo';
import { extensionOf, keepFile } from '../../../lib/files';
import { formatDate, formatTime } from '../../../lib/format';
import { colors, ui } from '../../../lib/theme';
import {
  DOCUMENT_ROLES,
  TIMELINE_LABELS,
  activityTypeInfo,
  type Activity,
  type ActivityDocument,
  type DocumentRole,
  type Finding,
  type FollowUp,
  type Media,
  type TimelineEvent,
} from '../../../lib/types';

interface Detail {
  activity: Activity;
  timeline: TimelineEvent[];
  media: Media[];
  documents: ActivityDocument[];
  findings: Finding[];
  followUps: FollowUp[];
}

export default function KegiatanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [detail, setDetail] = useState<Detail | null>(null);

  const load = useCallback(async () => {
    const activity = await getActivity(db, id);
    if (!activity) return;
    const [timeline, media, documents, findings, followUps] = await Promise.all([
      listTimeline(db, id),
      listMedia(db, id),
      listDocuments(db, id),
      listFindings(db, id),
      listFollowUps(db, id),
    ]);
    setDetail({ activity, timeline, media, documents, findings, followUps });
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!detail) return <View style={ui.screen} />;
  const { activity, timeline, media, documents, findings, followUps } = detail;
  const type = activityTypeInfo(activity.type);
  const photos = media.filter((m) => m.kind === 'photo');
  const voices = media.filter((m) => m.kind === 'voice');

  const mark = async (label: string) => {
    await addTimelineEvent(db, id, label);
    load();
  };

  const addPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin dibutuhkan', 'Izinkan akses kamera/galeri untuk menambah foto.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true });
    if (result.canceled) return;
    for (const asset of result.assets) {
      const uri = await keepFile(asset.uri, id, `foto.${extensionOf(asset.uri, 'jpg')}`);
      await addMedia(db, { activityId: id, kind: 'photo', localUri: uri });
    }
    load();
  };

  const saveVoice = async (tempUri: string, durationMs: number) => {
    const uri = await keepFile(tempUri, id, `suara.${extensionOf(tempUri, 'm4a')}`);
    await addMedia(db, { activityId: id, kind: 'voice', localUri: uri, durationMs });
    load();
  };

  const pickDocument = async (role: DocumentRole) => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    for (const asset of result.assets) {
      const uri = await keepFile(asset.uri, id, asset.name);
      await addDocument(db, {
        activityId: id,
        role,
        title: asset.name,
        mimeType: asset.mimeType ?? null,
        size: asset.size ?? null,
        localUri: uri,
      });
    }
    load();
  };

  const askDocumentRole = () =>
    Alert.alert(
      'Simpan sebagai',
      undefined,
      DOCUMENT_ROLES.slice(0, 3).map((r) => ({ text: r.label, onPress: () => pickDocument(r.key) })),
      { cancelable: true },
    );

  const byKind = (kind: Finding['kind']) => findings.filter((f) => f.kind === kind);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Stack.Screen options={{ title: type.label }} />

      <View style={ui.card}>
        <Text style={ui.muted}>
          {type.icon} {formatDate(activity.start_at)} · {formatTime(activity.start_at)}
        </Text>
        <Text style={ui.h1}>{activity.title}</Text>
        {activity.organizer ? <Text style={ui.body}>Penyelenggara: {activity.organizer}</Text> : null}
        {activity.location_name ? <Text style={ui.body}>📍 {activity.location_name}</Text> : null}
        {activity.spt_number ? <Text style={ui.muted}>SPT: {activity.spt_number}</Text> : null}
      </View>

      <Section title="⏱️ Timeline">
        {timeline.map((t) => (
          <Text key={t.id} style={ui.body}>
            {formatTime(t.at)}  {t.label}
          </Text>
        ))}
        <View style={ui.wrap}>
          {TIMELINE_LABELS.map((label) => (
            <Button key={label} label={label} onPress={() => mark(label)} />
          ))}
        </View>
      </Section>

      <Section title={`📷 Foto (${photos.length})`}>
        <View style={ui.wrap}>
          {photos.map((p) => (
            <Image key={p.id} source={{ uri: p.local_uri }} style={styles.thumb} />
          ))}
        </View>
        <View style={ui.row}>
          <Button label="Kamera" onPress={() => addPhoto('camera')} style={{ flex: 1 }} />
          <Button label="Galeri" onPress={() => addPhoto('library')} style={{ flex: 1 }} />
        </View>
      </Section>

      <Section title={`🎙️ Catatan suara (${voices.length})`}>
        {voices.map((v) => (
          <VoicePlayer key={v.id} media={v} />
        ))}
        <VoiceRecorder onSaved={saveVoice} />
      </Section>

      <Section title={`📎 Bahan (${documents.length})`}>
        {DOCUMENT_ROLES.map((r) => {
          const docs = documents.filter((d) => d.role === r.key);
          if (docs.length === 0) return null;
          return (
            <View key={r.key} style={{ gap: 4 }}>
              <Text style={ui.label}>{r.label}</Text>
              {docs.map((d) => (
                <Text key={d.id} style={ui.body}>
                  ✓ {d.title}
                </Text>
              ))}
            </View>
          );
        })}
        <Button label="+ Tambah bahan" onPress={askDocumentRole} />
      </Section>

      {activity.status === 'selesai' || findings.length > 0 || activity.notes ? (
        <Section title="📝 Hasil kegiatan">
          {activity.notes ? <Text style={ui.body}>{activity.notes}</Text> : null}
          <FindingList title="Hasil" items={byKind('hasil')} />
          <FindingList title="Kesimpulan" items={byKind('kesimpulan')} />
          <FindingList title="Rekomendasi" items={byKind('rekomendasi')} />
          {followUps.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={ui.label}>Follow-up</Text>
              {followUps.map((f) => (
                <Text key={f.id} style={ui.body}>
                  {f.done ? '☑' : '☐'} {f.text}
                </Text>
              ))}
            </View>
          )}
        </Section>
      ) : null}

      <Button
        variant="primary"
        label={activity.status === 'selesai' ? 'Ubah hasil kegiatan' : 'Selesaikan Kegiatan'}
        onPress={() => router.push({ pathname: '/kegiatan/[id]/selesai', params: { id } })}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={ui.card}>
      <Text style={ui.h2}>{title}</Text>
      {children}
    </View>
  );
}

function FindingList({ title, items }: { title: string; items: Finding[] }) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 4 }}>
      <Text style={ui.label}>{title}</Text>
      {items.map((f, i) => (
        <Text key={f.id} style={ui.body}>
          {i + 1}. {f.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 96, height: 96, borderRadius: 8, backgroundColor: colors.border },
});
