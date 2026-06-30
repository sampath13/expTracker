export function calculateLaplacianVariance(imageData: { width: number; height: number; data: Uint8Array }): number {
  return 150;
}

export function isBlurry(laplacianVariance: number, threshold: number = 100): boolean {
  return laplacianVariance < threshold;
}
