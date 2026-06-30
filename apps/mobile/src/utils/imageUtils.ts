import RNFS from 'react-native-fs';

const CAPTURE_DIR = `${RNFS.CachesDirectoryPath}/captures/`;

export async function ensureCaptureDir(): Promise<void> {
  const exists = await RNFS.exists(CAPTURE_DIR);
  if (!exists) {
    await RNFS.mkdir(CAPTURE_DIR);
  }
}

export function getCapturePath(): string {
  const timestamp = Date.now();
  return `${CAPTURE_DIR}${timestamp}.jpg`;
}

export async function deleteCaptureFile(filePath: string): Promise<void> {
  const exists = await RNFS.exists(filePath);
  if (exists) {
    await RNFS.unlink(filePath);
  }
}

export async function deleteAllCaptures(): Promise<void> {
  const exists = await RNFS.exists(CAPTURE_DIR);
  if (exists) {
    await RNFS.unlink(CAPTURE_DIR);
    await RNFS.mkdir(CAPTURE_DIR);
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  return RNFS.exists(filePath);
}
