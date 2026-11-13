function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Map visible crop frame to source image rectangle (natural pixels). */
export function computeCropRect(
  image: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  zoom: number,
  panX: number,
  panY: number,
): { x: number; y: number; width: number; height: number } {
  const baseScale = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const left = (frameWidth - drawW) / 2 + panX;
  const top = (frameHeight - drawH) / 2 + panY;

  const srcX = Math.max(0, (0 - left) / scale);
  const srcY = Math.max(0, (0 - top) / scale);
  const srcW = Math.min(image.naturalWidth - srcX, frameWidth / scale);
  const srcH = Math.min(image.naturalHeight - srcY, frameHeight / scale);

  return {
    x: Math.round(srcX),
    y: Math.round(srcY),
    width: Math.round(Math.max(1, srcW)),
    height: Math.round(Math.max(1, srcH)),
  };
}

export async function cropImageFromFrame(
  imageSrc: string,
  frameWidth: number,
  frameHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  outputSize: { width: number; height: number },
  mime: string,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const rect = computeCropRect(image, frameWidth, frameHeight, zoom, panX, panY);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop image");
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, outputSize.width, outputSize.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not export image"))), mime, 0.92);
  });
}
