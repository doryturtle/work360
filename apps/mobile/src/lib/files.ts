import { Directory, File, Paths } from 'expo-file-system';

// Foto, suara, dan dokumen disalin ke folder aplikasi supaya tetap ada walau
// file asli di galeri/Download dihapus, dan bisa dibuka tanpa internet.
export async function keepFile(sourceUri: string, activityId: string, name: string) {
  const dir = new Directory(Paths.document, 'kegiatan', activityId);
  if (!dir.exists) dir.create({ intermediates: true });
  const safeName = name.replace(/[^\w.\- ]+/g, '_');
  const target = new File(dir, `${Date.now()}-${safeName}`);
  await new File(sourceUri).copy(target);
  return target.uri;
}

export function extensionOf(uri: string, fallback: string) {
  const match = /\.(\w{2,5})(?:\?|$)/.exec(uri);
  return match ? match[1].toLowerCase() : fallback;
}
