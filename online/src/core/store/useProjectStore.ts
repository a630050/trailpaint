import { create } from 'zustand';
import type { Project, Spot } from '../models/types';
import { DEFAULT_CARD_OFFSET, DEFAULT_CENTER, DEFAULT_ZOOM } from '../models/types';
import { t } from '../../i18n';

interface ProjectState {
  project: Project;
  selectedSpotId: string | null;
  sidebarOpen: boolean;
  pendingFlyTo: { center: [number, number]; zoom: number } | null;

  addSpot: (latlng: [number, number]) => void;
  updateSpot: (id: string, patch: Partial<Spot>) => void;
  removeSpot: (id: string) => void;
  swapSpots: (index: number, direction: 'up' | 'down') => void;
  setSelectedSpot: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setMapView: (center: [number, number], zoom: number) => void;
  setProjectName: (name: string) => void;
  clearPendingFlyTo: () => void;

  exportJSON: () => string;
  importJSON: (json: string) => void;
}

function renumber(spots: Spot[]): Spot[] {
  return spots.map((s, i) => ({ ...s, num: i + 1 }));
}

function createEmptyProject(): Project {
  return {
    version: 1,
    name: 'Untitled',
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    spots: [],
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createEmptyProject(),
  selectedSpotId: null,
  sidebarOpen: true,
  pendingFlyTo: null,

  addSpot: (latlng) => {
    const id = crypto.randomUUID();
    set((s) => {
      const num = s.project.spots.length + 1;
      const spot: Spot = {
        id,
        latlng,
        num,
        title: `${t('spot.defaultTitle')} ${num}`,
        desc: '',
        photo: null,
        iconId: 'pin',
        cardOffset: { ...DEFAULT_CARD_OFFSET },
      };
      return {
        project: { ...s.project, spots: [...s.project.spots, spot] },
        selectedSpotId: id,
      };
    });
  },

  updateSpot: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        spots: s.project.spots.map((sp) =>
          sp.id === id ? { ...sp, ...patch } : sp
        ),
      },
    })),

  removeSpot: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        spots: renumber(s.project.spots.filter((sp) => sp.id !== id)),
      },
      selectedSpotId: s.selectedSpotId === id ? null : s.selectedSpotId,
    })),

  swapSpots: (index, direction) =>
    set((s) => {
      const spots = [...s.project.spots];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= spots.length) return s;
      [spots[index], spots[target]] = [spots[target], spots[index]];
      return { project: { ...s.project, spots: renumber(spots) } };
    }),

  setSelectedSpot: (id) => set({ selectedSpotId: id }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setMapView: (center, zoom) =>
    set((s) => ({ project: { ...s.project, center, zoom } })),

  setProjectName: (name) =>
    set((s) => ({ project: { ...s.project, name } })),

  clearPendingFlyTo: () => set({ pendingFlyTo: null }),

  exportJSON: () => JSON.stringify(get().project, null, 2),

  importJSON: (json) => {
    const data = JSON.parse(json) as Project;
    set({
      project: data,
      selectedSpotId: null,
      pendingFlyTo: { center: data.center, zoom: data.zoom },
    });
  },
}));
