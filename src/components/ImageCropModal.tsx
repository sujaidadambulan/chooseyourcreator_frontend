import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui";
import { cropImageFromFrame } from "../lib/imageCrop";

type Props = {
  open: boolean;
  file: File | null;
  title: string;
  aspect: number;
  outputSize: { width: number; height: number };
  onClose: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropModal({ open, file, title, aspect, outputSize, onClose, onConfirm }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const frame = useMemo(() => {
    const width = 360;
    const height = Math.round(width / aspect);
    return { width, height };
  }, [aspect]);

  const layout = useMemo(() => {
    if (!natural.w || !natural.h) return null;
    const baseScale = Math.max(frame.width / natural.w, frame.height / natural.h);
    const scale = baseScale * zoom;
    const drawW = natural.w * scale;
    const drawH = natural.h * scale;
    const left = (frame.width - drawW) / 2 + pan.x;
    const top = (frame.height - drawH) / 2 + pan.y;
    return { left, top, drawW, drawH };
  }, [natural, frame, zoom, pan]);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      setNatural({ w: 0, h: 0 });
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !file || !objectUrl) return null;

  async function handleSave() {
    setSubmitting(true);
    try {
      const mime = file!.type && file!.type.startsWith("image/") ? file!.type : "image/jpeg";
      const blob = await cropImageFromFrame(objectUrl!, frame.width, frame.height, zoom, pan.x, pan.y, outputSize, mime);
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const cropped = new File([blob], `crop.${ext}`, { type: mime });
      onConfirm(cropped);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-medium text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-soft cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-muted">Drag to reposition. Use zoom to fit your photo inside the frame.</p>
        <div
          className="relative mx-auto overflow-hidden rounded-xl border-2 border-dashed border-line bg-neutral-900 select-none touch-none"
          style={{ width: frame.width, height: frame.height }}
          onPointerDown={(e) => {
            setDragging(true);
            dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            setPan({
              x: dragStart.current.panX + (e.clientX - dragStart.current.x),
              y: dragStart.current.panY + (e.clientY - dragStart.current.y),
            });
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <img
            src={objectUrl}
            alt=""
            className="absolute max-w-none pointer-events-none"
            style={
              layout
                ? { left: layout.left, top: layout.top, width: layout.drawW, height: layout.drawH }
                : { opacity: 0 }
            }
            onLoad={(e) => {
              const img = e.currentTarget;
              setNatural({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            draggable={false}
          />
        </div>
        <label className="block text-xs font-medium text-muted">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-1 w-full accent-ink"
          />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={submitting || !natural.w}>
            {submitting ? "Saving…" : "Save photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
