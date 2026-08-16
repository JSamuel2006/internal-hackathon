import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

export interface PreprocessingMetadata {
  blurScore: number;
  blurDetected: boolean;
  originalWidth: number;
  originalHeight: number;
  resized: boolean;
  rotationApplied: number;
  enhancedPath: string;
  thresholdPath: string;
  sharpenedPath: string;
  highContrastPath: string;
  denoisedPath: string;
  rotate90Path: string;
  rotate270Path: string;
}

// Blur detection: Laplacian variance. Lower = blurrier.
// Threshold below which we consider an image too blurry for OCR
const BLUR_VARIANCE_THRESHOLD = 80;
const MIN_RESOLUTION = 600; // Minimum width in pixels for reliable OCR

export class OCRPreprocessor {
  /**
   * Computes the Laplacian variance of a grayscale image buffer as a blur metric.
   * Higher value = sharper image. Lower value = blurrier image.
   */
  private static computeLaplacianVariance(image: any): number {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const data = image.bitmap.data;

    // Laplacian kernel: center = 4, adjacent = -1
    const laplacian: number[] = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = data[((y * width) + x) * 4];
        const top    = data[(((y - 1) * width) + x) * 4];
        const bottom = data[(((y + 1) * width) + x) * 4];
        const left   = data[((y * width) + (x - 1)) * 4];
        const right  = data[((y * width) + (x + 1)) * 4];
        const val = Math.abs(4 * center - top - bottom - left - right);
        laplacian.push(val);
      }
    }

    if (laplacian.length === 0) return 0;

    const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
    const variance = laplacian.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / laplacian.length;
    return variance;
  }

  /**
   * Applies a simple approximation of noise reduction (blur + sharpen cycle).
   * Jimp does not have a native median filter, so we use a gaussian-like approach.
   */
  private static denoiseImage(image: any): any {
    // Apply a very slight gaussian-like blur to reduce noise, then sharpen to recover edges
    const denoised = image.clone();
    denoised.blur(1); // radius 1 = mild noise suppression
    // Re-apply sharpening to recover edges after denoising
    try {
      (denoised as any).convolute([
        [0, -0.5, 0],
        [-0.5, 3, -0.5],
        [0, -0.5, 0]
      ]);
    } catch {
      // Convolution not supported in this version — skip
    }
    return denoised;
  }

  /**
   * Applies a simple, robust adaptive thresholding (binarization) filter.
   */
  private static applyAdaptiveThreshold(image: any): void {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const data = image.bitmap.data;
    const size = width * height;

    const integral = new Int32Array(size);
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        sum += data[idx * 4];
        if (y === 0) {
          integral[idx] = sum;
        } else {
          integral[idx] = integral[(y - 1) * width + x] + sum;
        }
      }
    }

    const S = Math.floor(width / 8);
    const T = 15;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const x1 = Math.max(0, x - S / 2);
        const x2 = Math.min(width - 1, x + S / 2);
        const y1 = Math.max(0, y - S / 2);
        const y2 = Math.min(height - 1, y + S / 2);
        const count = Math.max(1, (x2 - x1) * (y2 - y1));
        const sum = integral[Math.floor(y2 * width + x2)]
          - integral[Math.floor(y1 * width + x2)]
          - integral[Math.floor(y2 * width + x1)]
          + integral[Math.floor(y1 * width + x1)];
        const localMean = sum / count;
        const currentPixel = data[idx * 4];
        const val = currentPixel < localMean * (100 - T) / 100 ? 0 : 255;
        data[idx * 4] = val;
        data[idx * 4 + 1] = val;
        data[idx * 4 + 2] = val;
      }
    }
  }

  /**
   * Main entry point: preprocess an uploaded medicine image for multi-pass OCR.
   * 
   * Steps:
   * 1. Validate file
   * 2. Load image
   * 3. Blur detection
   * 4. Resolution normalization (upscale if too small)
   * 5. Parallel generation of 5 preprocessing variants
   * 6. Save all to temp paths
   */
  public static async processImage(filePath: string): Promise<PreprocessingMetadata> {
    // === VALIDATION ===
    if (!filePath) throw new Error('Image filePath is not defined.');
    if (!fs.existsSync(filePath)) throw new Error(`Image file does not exist: ${filePath}`);
    const stats = fs.statSync(filePath);
    if (stats.size === 0) throw new Error('Image file is empty (0 bytes).');

    const ext = path.extname(filePath).toLowerCase();
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];
    if (!allowed.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Upload PNG, JPG, JPEG, or WEBP.`);
    }

    // === LOAD ===
    const original = await Jimp.read(filePath);
    if (!original?.bitmap) throw new Error('Failed to load image. File may be corrupted.');

    const origWidth  = original.bitmap.width;
    const origHeight = original.bitmap.height;

    // === BLUR DETECTION ===
    // Convert to grayscale copy for measurement
    const grayForBlur = original.clone().greyscale();
    const blurScore = this.computeLaplacianVariance(grayForBlur);
    const blurDetected = blurScore < BLUR_VARIANCE_THRESHOLD;

    // If extremely blurry/textureless (variance < 2), reject immediately
    if (blurScore < 2) {
      throw new Error(
        `Image quality is too low (blur score: ${blurScore.toFixed(1)}). ` +
        'Please capture a clearer image with better lighting and focus.'
      );
    }

    // === RESOLUTION NORMALIZATION ===
    let resized = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let workingImage: any = original.clone();
    if (origWidth < MIN_RESOLUTION) {
      const scale = MIN_RESOLUTION / origWidth;
      workingImage = workingImage.scale(scale);
      resized = true;
    }

    // === ROTATION CORRECTION ===
    // We try 0°, 90°, 180°, 270° and pick the orientation that produces
    // the most horizontal text (heuristic: maximum horizontal white-runs).
    // For performance, we do this only on a small thumbnail.
    const rotationApplied = 0; // Default: no rotation. Full rotation detection is backend-compute-intensive.
    // Note: Tesseract's PSM 3 handles rotation automatically via OSD (Orientation & Script Detection).

    // === PARALLEL PREPROCESSING ===
    // Generate all variants simultaneously
    const [enhanced, thresholdImage, sharpened, highContrast, denoised, rotate90, rotate270] = await Promise.all([
      // 1. Enhanced: grayscale + contrast boost + brightness lift
      Promise.resolve(
        workingImage.clone()
          .greyscale()
          .contrast(0.25)
          .brightness(0.12)
      ),
      // 2. Threshold/Binarized: adaptive local threshold
      Promise.resolve((() => {
        const img = workingImage.clone().greyscale();
        this.applyAdaptiveThreshold(img as any);
        return img;
      })()),
      // 3. Sharpened: convolution sharpen kernel
      Promise.resolve((() => {
        const img = workingImage.clone().greyscale();
        try {
          (img as any).convolute([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
          ]);
        } catch {
          // fallback: just sharpen by re-contrasting
          img.contrast(0.4);
        }
        return img;
      })()),
      // 4. High Contrast: aggressive contrast for faded labels
      Promise.resolve(
        workingImage.clone()
          .greyscale()
          .contrast(0.65)
          .brightness(-0.05)
      ),
      // 5. Denoised: noise reduction pass
      Promise.resolve(this.denoiseImage(workingImage.clone().greyscale())),
      // 6. Rotate 90
      Promise.resolve(workingImage.clone().rotate(90)),
      // 7. Rotate 270 (-90)
      Promise.resolve(workingImage.clone().rotate(270)),
    ]);

    // === SAVE ALL VARIANTS ===
    const enhancedPath     = filePath.replace(/(\.\w+)$/, '_enhanced$1');
    const thresholdPath    = filePath.replace(/(\.\w+)$/, '_threshold$1');
    const sharpenedPath    = filePath.replace(/(\.\w+)$/, '_sharpened$1');
    const highContrastPath = filePath.replace(/(\.\w+)$/, '_highcontrast$1');
    const denoisedPath     = filePath.replace(/(\.\w+)$/, '_denoised$1');
    const rotate90Path     = filePath.replace(/(\.\w+)$/, '_rotate90$1');
    const rotate270Path    = filePath.replace(/(\.\w+)$/, '_rotate270$1');

    await Promise.all([
      enhanced.write(enhancedPath as any),
      thresholdImage.write(thresholdPath as any),
      sharpened.write(sharpenedPath as any),
      highContrast.write(highContrastPath as any),
      denoised.write(denoisedPath as any),
      rotate90.write(rotate90Path as any),
      rotate270.write(rotate270Path as any),
    ]);

    return {
      blurScore,
      blurDetected,
      originalWidth: origWidth,
      originalHeight: origHeight,
      resized,
      rotationApplied,
      enhancedPath,
      thresholdPath,
      sharpenedPath,
      highContrastPath,
      denoisedPath,
      rotate90Path,
      rotate270Path,
    };
  }
}
