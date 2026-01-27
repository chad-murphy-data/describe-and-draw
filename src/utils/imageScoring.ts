export interface AlignmentInfo {
  rotation: number;
  scale: number;
  translateX: number;
  translateY: number;
}

export interface ScoringResult {
  score: number;
  alignmentInfo: AlignmentInfo;
  overlayImageData: string;
}

// Convert an image (SVG string or base64 image) to binary canvas data
const imageToCanvas = async (
  imageSource: string,
  size: number = 100
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Calculate scaling to fit while maintaining aspect ratio
      const scale = Math.min(size / img.width, size / img.height) * 0.9;
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      ctx.drawImage(img, x, y, width, height);
      resolve(canvas);
    };
    img.onerror = () => {
      resolve(canvas); // Return blank canvas on error
    };

    // Handle SVG vs base64
    if (imageSource.startsWith('<svg') || imageSource.includes('<svg')) {
      // Convert SVG to data URL - replace currentColor with black
      const svgWithColor = imageSource.replace(/currentColor/g, 'black');
      const svgBlob = new Blob([svgWithColor], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(svgBlob);
    } else {
      img.src = imageSource;
    }
  });
};

// Convert canvas to binary (black/white) pixels
const canvasToBinary = (
  canvas: HTMLCanvasElement,
  threshold: number = 200
): boolean[][] => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const result: boolean[][] = [];

  for (let y = 0; y < canvas.height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      // Check if pixel is dark (drawn)
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      row.push(brightness < threshold);
    }
    result.push(row);
  }

  return result;
};

// Calculate center of mass
const centerOfMass = (
  binary: boolean[][]
): { cx: number; cy: number } => {
  let totalX = 0;
  let totalY = 0;
  let count = 0;

  for (let y = 0; y < binary.length; y++) {
    for (let x = 0; x < binary[y].length; x++) {
      if (binary[y][x]) {
        totalX += x;
        totalY += y;
        count++;
      }
    }
  }

  return count > 0
    ? { cx: totalX / count, cy: totalY / count }
    : { cx: binary[0].length / 2, cy: binary.length / 2 };
};

// Apply transformation and calculate overlap score
const calculateOverlap = (
  original: boolean[][],
  submission: boolean[][],
  rotation: number,
  scale: number,
  translateX: number,
  translateY: number
): number => {
  const size = original.length;
  const cx = size / 2;
  const cy = size / 2;
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  let overlap = 0;
  let originalPixels = 0;
  let submissionPixels = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (original[y][x]) originalPixels++;

      // Transform submission coordinates
      const dx = (x - cx) / scale;
      const dy = (y - cy) / scale;
      const srcX = Math.round(dx * cos - dy * sin + cx - translateX);
      const srcY = Math.round(dx * sin + dy * cos + cy - translateY);

      const subPixel =
        srcX >= 0 && srcX < size && srcY >= 0 && srcY < size
          ? submission[srcY][srcX]
          : false;

      if (subPixel) submissionPixels++;
      if (original[y][x] && subPixel) overlap++;
    }
  }

  // Modified scoring: focus on how much of the original was captured
  // rather than strict IoU (which penalizes extra strokes too harshly)
  if (originalPixels === 0) return 0;

  // Base score: how much of the original drawing was covered
  const coverageScore = overlap / originalPixels;

  // Penalty for excess drawing (but mild - only penalize if WAY more strokes)
  const excessRatio = submissionPixels / Math.max(originalPixels, 1);
  const excessPenalty = excessRatio > 2 ? Math.min(0.3, (excessRatio - 2) * 0.1) : 0;

  // Combine: coverage minus small penalty for huge excess
  const rawScore = Math.max(0, coverageScore - excessPenalty);

  // Apply a curve to make scores feel better (sqrt makes low scores higher)
  return Math.pow(rawScore, 0.7);
};

// Find best alignment through iterative search
const findBestAlignment = (
  original: boolean[][],
  submission: boolean[][]
): { score: number; alignment: AlignmentInfo } => {
  let bestScore = 0;
  let bestAlignment: AlignmentInfo = {
    rotation: 0,
    scale: 1,
    translateX: 0,
    translateY: 0,
  };

  // Initial alignment based on center of mass
  const origCom = centerOfMass(original);
  const subCom = centerOfMass(submission);
  const initTransX = subCom.cx - origCom.cx;
  const initTransY = subCom.cy - origCom.cy;

  // Coarse search
  for (let rot = -180; rot < 180; rot += 15) {
    for (let scale = 0.5; scale <= 1.5; scale += 0.2) {
      for (let tx = initTransX - 10; tx <= initTransX + 10; tx += 10) {
        for (let ty = initTransY - 10; ty <= initTransY + 10; ty += 10) {
          const score = calculateOverlap(original, submission, rot, scale, tx, ty);
          if (score > bestScore) {
            bestScore = score;
            bestAlignment = { rotation: rot, scale, translateX: tx, translateY: ty };
          }
        }
      }
    }
  }

  // Medium refinement
  const { rotation: r1, scale: s1, translateX: tx1, translateY: ty1 } = bestAlignment;
  for (let rot = r1 - 15; rot <= r1 + 15; rot += 5) {
    for (let scale = Math.max(0.5, s1 - 0.2); scale <= Math.min(1.5, s1 + 0.2); scale += 0.1) {
      for (let tx = tx1 - 5; tx <= tx1 + 5; tx += 5) {
        for (let ty = ty1 - 5; ty <= ty1 + 5; ty += 5) {
          const score = calculateOverlap(original, submission, rot, scale, tx, ty);
          if (score > bestScore) {
            bestScore = score;
            bestAlignment = { rotation: rot, scale, translateX: tx, translateY: ty };
          }
        }
      }
    }
  }

  // Fine refinement
  const { rotation: r2, scale: s2, translateX: tx2, translateY: ty2 } = bestAlignment;
  for (let rot = r2 - 5; rot <= r2 + 5; rot += 1) {
    for (let scale = Math.max(0.5, s2 - 0.1); scale <= Math.min(1.5, s2 + 0.1); scale += 0.05) {
      for (let tx = tx2 - 3; tx <= tx2 + 3; tx += 1) {
        for (let ty = ty2 - 3; ty <= ty2 + 3; ty += 1) {
          const score = calculateOverlap(original, submission, rot, scale, tx, ty);
          if (score > bestScore) {
            bestScore = score;
            bestAlignment = { rotation: rot, scale, translateX: tx, translateY: ty };
          }
        }
      }
    }
  }

  return { score: bestScore, alignment: bestAlignment };
};

// Generate overlay visualization
const createOverlayImage = async (
  originalSvg: string,
  submissionBase64: string,
  alignment: AlignmentInfo,
  size: number = 300
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // Draw original in blue
  const origCanvas = await imageToCanvas(originalSvg, size);
  const origCtx = origCanvas.getContext('2d')!;
  const origData = origCtx.getImageData(0, 0, size, size);

  // Draw submission in red (with transformation)
  const subCanvas = await imageToCanvas(submissionBase64, size);

  // Create transformed submission canvas
  const transformedCanvas = document.createElement('canvas');
  transformedCanvas.width = size;
  transformedCanvas.height = size;
  const transformedCtx = transformedCanvas.getContext('2d')!;
  transformedCtx.fillStyle = 'white';
  transformedCtx.fillRect(0, 0, size, size);

  transformedCtx.save();
  transformedCtx.translate(size / 2, size / 2);
  transformedCtx.rotate((alignment.rotation * Math.PI) / 180);
  transformedCtx.scale(alignment.scale, alignment.scale);
  transformedCtx.translate(-size / 2 + alignment.translateX, -size / 2 + alignment.translateY);
  transformedCtx.drawImage(subCanvas, 0, 0);
  transformedCtx.restore();

  const subData = transformedCtx.getImageData(0, 0, size, size);

  // Composite: blue for original, red for submission, purple for overlap
  const resultData = ctx.createImageData(size, size);
  for (let i = 0; i < origData.data.length; i += 4) {
    const origDark = (origData.data[i] + origData.data[i + 1] + origData.data[i + 2]) / 3 < 200;
    const subDark = (subData.data[i] + subData.data[i + 1] + subData.data[i + 2]) / 3 < 200;

    if (origDark && subDark) {
      // Overlap - purple
      resultData.data[i] = 128;     // R
      resultData.data[i + 1] = 0;   // G
      resultData.data[i + 2] = 128; // B
      resultData.data[i + 3] = 255; // A
    } else if (origDark) {
      // Original only - blue
      resultData.data[i] = 0;       // R
      resultData.data[i + 1] = 100; // G
      resultData.data[i + 2] = 255; // B
      resultData.data[i + 3] = 255; // A
    } else if (subDark) {
      // Submission only - red
      resultData.data[i] = 255;     // R
      resultData.data[i + 1] = 100; // G
      resultData.data[i + 2] = 100; // B
      resultData.data[i + 3] = 255; // A
    } else {
      // White background
      resultData.data[i] = 255;
      resultData.data[i + 1] = 255;
      resultData.data[i + 2] = 255;
      resultData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(resultData, 0, 0);
  return canvas.toDataURL('image/png');
};

// Main scoring function
export const scoreSubmission = async (
  originalSvg: string,
  submissionBase64: string
): Promise<ScoringResult> => {
  try {
    // Convert to binary at low resolution for alignment
    const origCanvas = await imageToCanvas(originalSvg, 100);
    const subCanvas = await imageToCanvas(submissionBase64, 100);

    const origBinary = canvasToBinary(origCanvas);
    const subBinary = canvasToBinary(subCanvas);

    // Find best alignment
    const { score, alignment } = findBestAlignment(origBinary, subBinary);

    // Create overlay visualization at higher resolution
    const overlayImageData = await createOverlayImage(
      originalSvg,
      submissionBase64,
      alignment,
      300
    );

    return {
      score: Math.round(score * 100), // Convert to percentage
      alignmentInfo: alignment,
      overlayImageData,
    };
  } catch (error) {
    console.error('Scoring error:', error);
    return {
      score: 0,
      alignmentInfo: { rotation: 0, scale: 1, translateX: 0, translateY: 0 },
      overlayImageData: '',
    };
  }
};
