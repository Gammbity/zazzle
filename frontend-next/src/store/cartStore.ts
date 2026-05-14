import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  cover: string;
  unitPrice: number;
  currency: 'UZS';
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: input => {
        const qty = input.qty ?? 1;
        set(state => {
          const existing = state.items.find(i => i.id === input.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === input.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...input, qty }] };
        });
      },
      remove: id => set(state => ({ items: state.items.filter(i => i.id !== id) })),
      setQty: (id, qty) =>
        set(state => ({
          items:
            qty <= 0
              ? state.items.filter(i => i.id !== id)
              : state.items.map(i => (i.id === id ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    }),
    {
      name: 'zazzle-cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
