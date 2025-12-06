import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationData, DetectedEntity } from '@/services/mcef/mcefApi';

export interface Screenshot {
  id: string;
  image: string;
  timestamp: number;
  location?: LocationData;
  entities?: DetectedEntity[];
}

interface CameraGalleryState {
  gallery: Screenshot[];
  addScreenshot: (image: string, location?: LocationData, entities?: DetectedEntity[]) => void;
  removeScreenshot: (index: number) => void;
  clearGallery: () => void;
}

export const useCameraGalleryStore = create<CameraGalleryState>()(
  persist(
    (set) => ({
      gallery: [],
      addScreenshot: (image: string, location?: LocationData, entities?: DetectedEntity[]) =>
        set((state) => ({
          gallery: [
            {
              id: `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              image,
              timestamp: Date.now(),
              location,
              entities,
            },
            ...state.gallery,
          ],
        })),
      removeScreenshot: (index: number) =>
        set((state) => ({
          gallery: state.gallery.filter((_, i) => i !== index),
        })),
      clearGallery: () => set({ gallery: [] }),
    }),
    {
      name: 'camera-gallery-storage',
      version: 2,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
