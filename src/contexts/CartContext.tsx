import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { MOCK_PRODUCTS } from '../constants/data';
import type { CartCoupon, CartItem, CartTotals, Product } from '../constants/types';

const CART_STORAGE_KEY = 'hama_cart_v1';
const VIEWED_STORAGE_KEY = 'hama_cart_viewed_v1';

export const AVAILABLE_COUPONS: CartCoupon[] = [
  { code: 'HAMA10', type: 'percentage', value: 10, minSubtotal: 20000, description: '10% off orders over KSh 20,000' },
  { code: 'HAMA25', type: 'percentage', value: 25, minSubtotal: 100000, description: '25% off orders over KSh 100,000' },
  { code: 'MOVING5', type: 'fixed', value: 5000, minSubtotal: 30000, description: 'KSh 5,000 off orders over KSh 30,000' },
];

const DELIVERY_STANDARD = 400;
const DELIVERY_EXPRESS = 900;
const FREE_DELIVERY_THRESHOLD = 10000;
const VAT_RATE = 0.16;

interface CartContextValue {
  isHydrated: boolean;
  items: CartItem[];
  cartProducts: Product[];
  savedProducts: Product[];
  recentlyViewed: Product[];
  lastRemoved: { product: Product; quantity: number } | null;
  appliedCoupon: CartCoupon | null;
  totals: CartTotals;
  totalQuantity: number;
  selectedQuantity: number;
  allSelected: boolean;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  undoRemove: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  toggleSelected: (productId: string) => void;
  toggleAll: (selected: boolean) => void;
  removeSelected: () => void;
  toggleSaved: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  trackView: (productId: string) => void;
  inCart: (productId: string) => boolean;
  cartQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const getProduct = (id: string): Product | undefined => MOCK_PRODUCTS.find((p) => p.id === id);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CartCoupon | null>(null);
  const [lastRemoved, setLastRemoved] = useState<{ product: Product; quantity: number } | null>(null);
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Hydration ----------
  useEffect(() => {
    (async () => {
      try {
        const [rawCart, rawViewed, rawCoupon] = await Promise.all([
          AsyncStorage.getItem(CART_STORAGE_KEY),
          AsyncStorage.getItem(VIEWED_STORAGE_KEY),
          AsyncStorage.getItem('hama_cart_coupon_v1'),
        ]);
        if (rawCart) setItems(JSON.parse(rawCart));
        if (rawViewed) setViewedIds(JSON.parse(rawViewed));
        if (rawCoupon) {
          const found = AVAILABLE_COUPONS.find((c) => c.code === rawCoupon);
          if (found) setAppliedCoupon(found);
        }
      } catch {
        // Corrupt storage — start with an empty cart
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(viewedIds)).catch(() => {});
  }, [viewedIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (appliedCoupon) {
      AsyncStorage.setItem('hama_cart_coupon_v1', appliedCoupon.code).catch(() => {});
    } else {
      AsyncStorage.removeItem('hama_cart_coupon_v1').catch(() => {});
    }
  }, [appliedCoupon, isHydrated]);

  useEffect(() => () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
  }, []);

  // ---------- Derived data ----------
  const cartProducts = useMemo(
    () => items.filter((i) => !i.savedForLater).map((i) => getProduct(i.productId)).filter((p): p is Product => !!p),
    [items]
  );

  const savedProducts = useMemo(
    () => items.filter((i) => i.savedForLater).map((i) => getProduct(i.productId)).filter((p): p is Product => !!p),
    [items]
  );

  const recentlyViewed = useMemo(() => {
    const ids = viewedIds.filter((id) => !items.some((i) => i.productId === id));
    return ids.slice(0, 10).map(getProduct).filter((p): p is Product => !!p);
  }, [viewedIds, items]);

  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const selectedQuantity = useMemo(
    () => items.filter((i) => i.selected && !i.savedForLater).reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const allSelected = useMemo(
    () => items.length > 0 && items.filter((i) => !i.savedForLater).every((i) => i.selected),
    [items]
  );

  const totals = useMemo<CartTotals>(() => {
    let subtotal = 0;
    let originalTotal = 0;
    for (const item of items) {
      if (!item.selected || item.savedForLater) continue;
      const p = getProduct(item.productId);
      if (!p) continue;
      subtotal += p.price * item.quantity;
      originalTotal += (p.originalPrice ?? p.price) * item.quantity;
    }
    const savings = Math.max(0, originalTotal - subtotal);

    let discount = 0;
    if (appliedCoupon) {
      if (subtotal >= appliedCoupon.minSubtotal) {
        discount = appliedCoupon.type === 'percentage'
          ? Math.round(subtotal * (appliedCoupon.value / 100))
          : appliedCoupon.value;
      }
    }
    const discounted = Math.max(0, subtotal - discount);

    const delivery = subtotal === 0 ? 0 : discounted >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_STANDARD;
    const tax = Math.round(discounted * VAT_RATE);
    const total = discounted + delivery + tax;

    return {
      subtotal,
      savings,
      delivery,
      tax,
      discount,
      total,
      itemCount: items.filter((i) => i.selected && !i.savedForLater).length,
    };
  }, [items, appliedCoupon]);

  // ---------- Mutations ----------
  const persistRemoval = useCallback((product: Product, quantity: number) => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setLastRemoved({ product, quantity });
    undoTimeout.current = setTimeout(() => setLastRemoved(null), 30000);
  }, []);

  const addItem = useCallback((productId: string, quantity = 1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        if (existing.savedForLater) {
          return prev.map((i) =>
            i.productId === productId ? { ...i, savedForLater: false, selected: true, quantity: i.quantity + quantity } : i
          );
        }
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity, selected: true } : i
        );
      }
      return [
        ...prev,
        { productId, quantity, selected: true, savedForLater: false, addedAt: new Date().toISOString() },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    const product = getProduct(productId);
    const item = items.find((i) => i.productId === productId);
    if (product && item) persistRemoval(product, item.quantity);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, [items, persistRemoval]);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setItems((prev) => [
      ...prev,
      { productId: lastRemoved.product.id, quantity: lastRemoved.quantity, selected: true, savedForLater: false, addedAt: new Date().toISOString() },
    ]);
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setLastRemoved(null);
  }, [lastRemoved]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const toggleSelected = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, selected: !i.selected } : i))
    );
  }, []);

  const toggleAll = useCallback((selected: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setItems((prev) => prev.map((i) => (i.savedForLater ? i : { ...i, selected })));
  }, []);

  const removeSelected = useCallback(() => {
    const toRemove = items.filter((i) => i.selected && !i.savedForLater);
    if (toRemove.length === 0) return;
    const product = getProduct(toRemove[0].productId);
    if (product) persistRemoval(product, toRemove[0].quantity);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setItems((prev) => prev.filter((i) => !(i.selected && !i.savedForLater)));
  }, [items, persistRemoval]);

  const toggleSaved = useCallback((productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, savedForLater: !i.savedForLater, selected: !i.savedForLater ? false : i.selected } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, selected: false })));
  }, []);

  const applyCoupon = useCallback((code: string): boolean => {
    const found = AVAILABLE_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return false;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setAppliedCoupon(found);
    return true;
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const trackView = useCallback((productId: string) => {
    setViewedIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 12));
  }, []);

  const inCart = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);
  const cartQuantity = useCallback((productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0, [items]);

  const value: CartContextValue = {
    isHydrated,
    items,
    cartProducts,
    savedProducts,
    recentlyViewed,
    lastRemoved,
    appliedCoupon,
    totals,
    totalQuantity,
    selectedQuantity,
    allSelected,
    addItem,
    removeItem,
    undoRemove,
    updateQuantity,
    setQuantity,
    toggleSelected,
    toggleAll,
    removeSelected,
    toggleSaved,
    clearCart,
    applyCoupon,
    removeCoupon,
    trackView,
    inCart,
    cartQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export const CART_CONSTANTS = { DELIVERY_STANDARD, DELIVERY_EXPRESS, FREE_DELIVERY_THRESHOLD };
