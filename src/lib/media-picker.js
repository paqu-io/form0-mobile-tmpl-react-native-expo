import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { uuidv7 } from './record-utils.js';

/**
 * Takes or chooses photos and videos for form0-react-native's PhotoField and
 * VideoField, which call `pick` from their camera and library buttons.
 *
 * The picker returns temporary files that the system may delete, while saved
 * records keep pointing at them. Picked files are therefore copied into the
 * app's documents folder, under form0-media/. Nothing is uploaded.
 */

const MEDIA_FOLDER = 'form0-media';

async function keepFile(asset) {
  const folder = new Directory(Paths.document, MEDIA_FOLDER);
  folder.create({ intermediates: true, idempotent: true });
  const source = new File(asset.uri);
  const extension = source.extension || (asset.type === 'video' ? '.mp4' : '.jpg');
  const target = new File(folder, `${uuidv7()}${extension}`);
  await source.copy(target);
  return target.uri;
}

async function launch({ kind, source, multiple, limit, field }) {
  const options = {
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    quality: 0.8,
  };
  if (source === 'library') {
    options.allowsMultipleSelection = multiple;
    if (limit) options.selectionLimit = limit;
    return ImagePicker.launchImageLibraryAsync(options);
  }

  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    throw new Error('Allow camera access in your settings to take photos and videos.');
  }
  // VideoField limits are total minutes; keep one recording within them.
  if (kind === 'video' && Number.isFinite(field?.max_length)) {
    options.videoMaxDuration = field.max_length * 60;
  }
  return ImagePicker.launchCameraAsync(options);
}

export const mediaPicker = {
  sources: ['camera', 'library'],
  async pick(request) {
    const result = await launch(request);
    if (result.canceled) return [];
    return Promise.all(
      result.assets.map(async (asset) => ({
        uri: await keepFile(asset),
        fileName: asset.fileName ?? null,
        mimeType: asset.mimeType ?? null,
        fileSize: asset.fileSize ?? null,
        // expo-image-picker reports milliseconds; form0 stores seconds.
        duration: typeof asset.duration === 'number' ? asset.duration / 1000 : null,
      }))
    );
  },
};
