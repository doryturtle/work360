import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Alert, Text, View } from 'react-native';

import { formatDuration, formatTime } from '../lib/format';
import { ui } from '../lib/theme';
import type { Media } from '../lib/types';
import { Button } from './Button';

// Tombol rekam catatan suara. onSaved menerima uri rekaman sementara dan durasinya.
export function VoiceRecorder({ onSaved }: { onSaved: (uri: string, durationMs: number) => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  const start = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin mikrofon', 'Izinkan mikrofon agar bisa merekam catatan suara.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async () => {
    const durationMs = state.durationMillis;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    if (recorder.uri) onSaved(recorder.uri, durationMs);
  };

  return state.isRecording ? (
    <Button
      variant="danger"
      label={`⏹ Berhenti & simpan (${formatDuration(state.durationMillis) || '0:00'})`}
      onPress={stop}
    />
  ) : (
    <Button label="🎙️ Catatan suara" onPress={start} />
  );
}

export function VoicePlayer({ media }: { media: Media }) {
  const player = useAudioPlayer(media.local_uri);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= status.duration) player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
      <Text style={ui.body}>
        🎙️ {formatTime(media.taken_at)} · {formatDuration(media.duration_ms)}
      </Text>
      <Button label={status.playing ? '⏸ Jeda' : '▶ Putar'} onPress={toggle} />
    </View>
  );
}
