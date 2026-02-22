import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Download, Trash2, X } from "lucide-react";
import { loadGalleryImages, deleteGalleryImage, type GalleryImage } from "@/lib/imageGallery";

export function ImageGallery({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [images, setImages] = useState<GalleryImage[]>(loadGalleryImages);
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  const refresh = () => setImages(loadGalleryImages());

  const handleDelete = (id: string) => {
    deleteGalleryImage(id);
    refresh();
    if (selected?.id === id) setSelected(null);
  };

  const handleDownload = (img: GalleryImage) => {
    const link = document.createElement("a");
    link.href = img.imageUrl;
    link.download = `${(img.caption || img.prompt).slice(0, 30).replace(/\s+/g, "_")}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background rounded-2xl shadow-xl border border-border max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-primary" />
              <h2 className="font-bold text-lg">Image Gallery</h2>
              <span className="text-xs text-muted-foreground">({images.length} images)</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ImageIcon size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No images generated yet</p>
                <p className="text-xs mt-1">Ask the AI to generate an image to get started!</p>
              </div>
            ) : selected ? (
              /* Detail view */
              <div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-primary hover:underline mb-3 inline-block"
                >
                  ← Back to gallery
                </button>
                <img
                  src={selected.imageUrl}
                  alt={selected.caption || selected.prompt}
                  className="w-full rounded-xl mb-3"
                />
                <p className="text-sm font-medium">{selected.caption || selected.prompt}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDownload(selected)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              /* Grid view */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    whileHover={{ scale: 1.02 }}
                    className="group relative cursor-pointer rounded-xl overflow-hidden border border-border bg-card"
                    onClick={() => setSelected(img)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.caption || img.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-background text-xs line-clamp-2 font-medium">
                        {img.caption || img.prompt}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
