import { Images } from 'react-native-nitro-image';

export interface BlurResult {
  isBlurry: boolean;
  variance: number;
  threshold: number;
}

function computeLaplacianVariance(
  data: Uint8Array,
  width: number,
  height: number,
): number {
  const bytesPerPixel = 4;
  const gray = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const offset = i * bytesPerPixel;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const laplacian: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const sum =
        0 * gray[idx - width - 1] +
        1 * gray[idx - width] +
        0 * gray[idx - width + 1] +
        1 * gray[idx - 1] +
        -4 * gray[idx] +
        1 * gray[idx + 1] +
        0 * gray[idx + width - 1] +
        1 * gray[idx + width] +
        0 * gray[idx + width + 1];
      laplacian.push(sum);
    }
  }

  if (laplacian.length === 0) return 0;

  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance =
    laplacian.reduce((sum, val) => sum + (val - mean) ** 2, 0) / laplacian.length;

  return variance;
}

export async function detectBlur(imagePath: string): Promise<BlurResult> {
  const image = await Images.loadFromFileAsync(imagePath);

  const aspectRatio = image.width / image.height;
  const maxDimension = 300;
  let resized;

  if (Math.max(image.width, image.height) > maxDimension) {
    if (image.width > image.height) {
      resized = await image.resizeAsync(
        maxDimension,
        Math.round(maxDimension / aspectRatio),
      );
    } else {
      resized = await image.resizeAsync(
        Math.round(maxDimension * aspectRatio),
        maxDimension,
      );
    }
  } else {
    resized = image;
  }

  const rawData = await resized.toRawPixelDataAsync();
  const bytes = new Uint8Array(rawData.buffer);
  const variance = computeLaplacianVariance(bytes, rawData.width, rawData.height);

  const threshold = 100;
  return { isBlurry: variance < threshold, variance, threshold };
}
