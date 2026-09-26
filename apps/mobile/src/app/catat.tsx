import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { createActivity } from '../db/repo';
import { parseLocalDateTime, toDateInput, toTimeInput } from '../lib/format';
import { colors, ui } from '../lib/theme';
import { ACTIVITY_TYPES, TRAVEL_TYPES, activityTypeInfo, type ActivityType } from '../lib/types';

export default function CatatAktivitas() {
  const [type, setType] = useState<ActivityType | null>(null);

  if (!type) {
    return (
      <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
        <Text style={ui.h1}>Apa yang Anda lakukan?</Text>
        {ACTIVITY_TYPES.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            onPress={() => setType(t.key)}
            style={({ pressed }) => [ui.card, styles.typeRow, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.typeIcon}>{t.icon}</Text>
            <Text style={ui.h2}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return <ActivityForm type={type} onChangeType={() => setType(null)} />;
}

function ActivityForm({ type, onChangeType }: { type: ActivityType; onChangeType: () => void }) {
  const db = useSQLiteContext();
  const info = activityTypeInfo(type);
  const now = new Date();
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [date, setDate] = useState(toDateInput(now));
  const [time, setTime] = useState(toTimeInput(now));
  const [showTravel, setShowTravel] = useState(TRAVEL_TYPES.includes(type));
  const [sptNumber, setSptNumber] = useState('');
  const [sptDate, setSptDate] = useState('');
  const [dpa, setDpa] = useState('');
  const [transport, setTransport] = useState('');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin lokasi', 'Izinkan lokasi, atau ketik nama tempat secara manual.');
        return;
      }
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(point);
      // Nama tempat butuh internet; bila offline cukup simpan koordinat.
      try {
        const [place] = await Location.reverseGeocodeAsync(point);
        const name = [place?.name, place?.subregion ?? place?.city].filter(Boolean).join(', ');
        if (name && !locationName) setLocationName(name);
      } catch {
        if (!locationName) setLocationName(`${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Lokasi', 'Lokasi tidak bisa dibaca. Ketik nama tempat secara manual.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const startAt = parseLocalDateTime(date, time);
    if (!title.trim()) return Alert.alert('Judul kosong', 'Isi judul kegiatan.');
    if (!startAt) return Alert.alert('Tanggal/jam tidak valid', 'Gunakan format 25/09/2026 dan 09.00.');
    setSaving(true);
    try {
      const id = await createActivity(db, {
        type,
        title: title.trim(),
        organizer: organizer.trim() || null,
        location_name: locationName.trim() || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        start_at: startAt,
        spt_number: sptNumber.trim() || null,
        spt_date: sptDate.trim() || null,
        dpa: dpa.trim() || null,
        transport: transport.trim() || null,
      });
      router.replace({ pathname: '/kegiatan/[id]', params: { id } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onChangeType} style={ui.row}>
        <Text style={styles.typeIcon}>{info.icon}</Text>
        <Text style={ui.h2}>{info.label}</Text>
        <Text style={[ui.muted, { marginLeft: 'auto' }]}>Ganti</Text>
      </Pressable>

      <Field label="Judul kegiatan">
        <TextInput style={ui.input} value={title} onChangeText={setTitle} placeholder="Bimtek KDKMP" autoFocus />
      </Field>
      <Field label="Penyelenggara">
        <TextInput style={ui.input} value={organizer} onChangeText={setOrganizer} placeholder="DPMD Provinsi" />
      </Field>
      <Field label="Lokasi">
        <TextInput
          style={ui.input}
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Bappelitbang Kabupaten Tapin"
        />
        <Button label={locating ? 'Mencari lokasi…' : '📍 Pakai lokasi saat ini'} onPress={useCurrentLocation} disabled={locating} />
      </Field>
      <View style={ui.row}>
        <Field label="Tanggal" style={{ flex: 3 }}>
          <TextInput style={ui.input} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
        </Field>
        <Field label="Jam" style={{ flex: 2 }}>
          <TextInput style={ui.input} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
        </Field>
      </View>

      {showTravel ? (
        <View style={ui.card}>
          <Text style={ui.label}>Perjalanan dinas (boleh diisi nanti)</Text>
          <TextInput style={ui.input} value={sptNumber} onChangeText={setSptNumber} placeholder="Nomor SPT" />
          <TextInput style={ui.input} value={sptDate} onChangeText={setSptDate} placeholder="Tanggal SPT" />
          <TextInput style={ui.input} value={dpa} onChangeText={setDpa} placeholder="DPA / kegiatan anggaran" />
          <TextInput
            style={ui.input}
            value={transport}
            onChangeText={setTransport}
            placeholder="Transportasi (mis. Kendaraan Umum)"
          />
        </View>
      ) : (
        <Button label="+ Data perjalanan dinas (SPT, DPA)" onPress={() => setShowTravel(true)} />
      )}

      <Button variant="primary" label={saving ? 'Menyimpan…' : 'SIMPAN'} onPress={save} disabled={saving} />
    </ScrollView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={ui.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  typeIcon: { fontSize: 26, color: colors.text },
});
