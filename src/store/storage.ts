import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const storage = createMMKV({ id: 'reprift-storage' });

export const mmkvStorage: StateStorage = {
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  getItem: (name: string): string | null => {
    return storage.getString(name) ?? null;
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};
