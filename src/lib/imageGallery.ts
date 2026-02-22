const STORAGE_KEY = "nexusai-image-gallery";

export interface GalleryImage {
  id: string;
  prompt: string;
  caption?: string;
  imageUrl: string;
  createdAt: number;
}

export function loadGalleryImages(): GalleryImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGeneratedImage(img: { prompt: string; caption?: string; imageUrl: string }) {
  const images = loadGalleryImages();
  images.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    prompt: img.prompt,
    caption: img.caption,
    imageUrl: img.imageUrl,
    createdAt: Date.now(),
  });
  // Keep max 50 images
  if (images.length > 50) images.length = 50;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}

export function deleteGalleryImage(id: string) {
  const images = loadGalleryImages().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
}
