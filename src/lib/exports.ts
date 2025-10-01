// src/lib/exports.ts
import * as htmlToImage from "html-to-image";

/** PNG con fondo sólido (evita transparencia) */
export async function downloadNodeAsPng(
  node: HTMLElement,
  filename = "export.png",
  opts: { backgroundColor?: string; pixelRatio?: number } = {}
) {
  const dataUrl = await htmlToImage.toPng(node, {
    cacheBust: true,
    pixelRatio: opts.pixelRatio ?? 2,
    // color base de tu app dark (ajústalo si usas otro)
    backgroundColor: opts.backgroundColor ?? "#0b0f1a",
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/** JPEG real (no renombrado), forzando fondo sólido */
export async function downloadNodeAsJpg(
  node: HTMLElement,
  filename = "export.jpg",
  opts: { backgroundColor?: string; quality?: number; pixelRatio?: number } = {}
) {
  const dataUrl = await htmlToImage.toJpeg(node, {
    cacheBust: true,
    quality: opts.quality ?? 0.95,
    pixelRatio: opts.pixelRatio ?? 2,
    backgroundColor: opts.backgroundColor ?? "#0b0f1a",
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
