import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CameraGalleryState {
  gallery: string[];
  addScreenshot: (image: string) => void;
  removeScreenshot: (index: number) => void;
  clearGallery: () => void;
}

export const useCameraGalleryStore = create<CameraGalleryState>()(
  persist(
    (set) => ({
      gallery: [],
      addScreenshot: (image: string) =>
        set((state) => ({
          gallery: [image, ...state.gallery],
        })),
      removeScreenshot: (index: number) =>
        set((state) => ({
          gallery: state.gallery.filter((_, i) => i !== index),
        })),
      clearGallery: () => set({ gallery: [] }),
    }),
    {
      name: 'camera-gallery-storage',
    }
  )
);
