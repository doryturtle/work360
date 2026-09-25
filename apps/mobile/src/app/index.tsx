import { Link, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { dayRange, homeCounts, listActivitiesBetween, listRecentActivities } from '../db/repo';
import { formatDate, formatDayHeading, formatTime } from '../lib/format';
import { ui } from '../lib/theme';
import { activityTypeInfo, type Activity } from '../lib/types';

export default function Home() {
  const db = useSQLiteContext();
  const [today, setToday] = useState<Activity[]>([]);
  const [recent, setRecent] = useState<Activity[]>([]);
  const [counts, setCounts] = useState({ reports: 0, followUps: 0 });

  useFocusEffect(
    useCallback(() => {
      const { start, end } = dayRange(new Date());
      Promise.all([listActivitiesBetween(db, start, end), listRecentActivities(db), homeCounts(db)]).then(
        ([t, r, c]) => {
          setToday(t);
          setRecent(r.filter((a) => a.start_at < start || a.start_at >= end));
          setCounts(c);
        },
      );
    }, [db]),
  );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.muted}>{formatDayHeading(new Date())}</Text>

      <Button
        variant="primary"
        label="+  CATAT AKTIVITAS"
        onPress={() => router.push('/catat')}
        style={styles.bigButton}
      />

      <Text style={ui.label}>Hari ini</Text>
      {today.length === 0 ? (
        <Text style={ui.muted}>Belum ada kegiatan hari ini.</Text>
      ) : (
        today.map((a) => <ActivityRow key={a.id} activity={a} showDate={false} />)
      )}

      <View style={ui.card}>
        <Summary icon="🔴" value={counts.reports} label="Laporan belum dibuat" />
        <Summary icon="🔄" value={counts.followUps} label="Follow-up terbuka" />
      </View>

      {recent.length > 0 && (
        <>
          <Text style={ui.label}>Kegiatan lain</Text>
          {recent.map((a) => (
            <ActivityRow key={a.id} activity={a} showDate />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const STATUS_LABEL: Record<Activity['status'], string> = {
  rencana: 'Rencana',
  persiapan: 'Persiapan',
  berlangsung: 'Berlangsung',
  selesai: 'Selesai',
};

function ActivityRow({ activity, showDate }: { activity: Activity; showDate: boolean }) {
  const type = activityTypeInfo(activity.type);
  return (
    <Link href={{ pathname: '/kegiatan/[id]', params: { id: activity.id } }} asChild>
      <Pressable style={ui.card}>
        <View style={ui.row}>
          <Text style={styles.icon}>{type.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={ui.muted}>
              {showDate ? `${formatDate(activity.start_at)} · ` : ''}
              {formatTime(activity.start_at)} · {type.label} · {STATUS_LABEL[activity.status]}
            </Text>
            <Text style={ui.h2}>{activity.title}</Text>
            {activity.location_name ? <Text style={ui.muted}>📍 {activity.location_name}</Text> : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function Summary({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={ui.row}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={ui.body}>
        <Text style={{ fontWeight: '700' }}>{value}</Text> {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bigButton: { paddingVertical: 20, marginVertical: 8 },
  icon: { fontSize: 22 },
});
