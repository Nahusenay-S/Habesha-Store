import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  addToCart: (product) =>
    set((state) => {
      const existingItem = state.items.find((item) => item._id === product._id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item._id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      ),
    })),
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => {
    return (state) =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));