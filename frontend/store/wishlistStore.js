import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(persist((set) => ({
  items: [],
  toggle: (product) => set((state) => ({
    items: state.items.some((item) => item._id === product._id)
      ? state.items.filter((item) => item._id !== product._id)
      : [...state.items, product],
  })),
}), { name: 'habesha-wishlist' }));
