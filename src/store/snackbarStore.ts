import { create } from 'zustand';

export type SnackbarVariant = 'info' | 'success' | 'error';

interface SnackbarState {
  message: string | null;
  variant: SnackbarVariant;
  show(message: string, variant?: SnackbarVariant): void;
  dismiss(): void;
}

export const useSnackbarStore = create<SnackbarState>()(set => ({
  message: null,
  variant: 'info',
  show: (message, variant = 'info') => set({ message, variant }),
  dismiss: () => set({ message: null }),
}));
