import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../src/constants/theme';
import { formatPrice } from '../src/utils/currency';
import { AVAILABLE_COUPONS, useCart } from '../src/contexts/CartContext';
import { MOCK_PRODUCTS as MOCK_PRODUCTS_FOR_RECS } from '../src/constants/data';
import type { Product, Seller } from '../src/constants/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ORANGE = '#FF6A00';
const SURFACE = '#1C1C1E';
const SURFACE2 = '#252528';

// ============ MOVE PLANNER ============
interface PlannerStep {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  productId: string;
}

const PLANNER_STEPS: PlannerStep[] = [
  { name: 'Sofa & Seating', icon: 'home', productId: 'p1' },
  { name: 'Bed Frame', icon: 'bed', productId: 'p2' },
  { name: 'Mattress', icon: 'moon', productId: 'p10' },
  { name: 'Smart TV', icon: 'tv', productId: 'p3' },
  { name: 'Refrigerator', icon: 'snow', productId: 'p4' },
  { name: 'Washing Machine', icon: 'water', productId: 'p8' },
  { name: 'Curtains', icon: 'albums', productId: 'p5' },
  { name: 'Kitchenware', icon: 'restaurant', productId: 'p12' },
  { name: 'Bedding', icon: 'shirt', productId: 'p11' },
  { name: 'Storage Boxes', icon: 'cube', productId: 'p13' },
  { name: 'Water Tank', icon: 'water-outline', productId: 'p14' },
  { name: 'Solar Power', icon: 'sunny', productId: 'p15' },
  { name: 'Power Inverter', icon: 'flash', productId: 'p16' },
  { name: 'Generator', icon: 'flash-outline', productId: 'p17' },
  { name: 'Water Dispenser', icon: 'wine', productId: 'p20' },
  { name: 'Air Conditioner', icon: 'thermometer', productId: 'p21' },
  { name: 'WiFi Router', icon: 'wifi', productId: 'p22' },
  { name: 'CCTV Security', icon: 'shield-checkmark', productId: 'p23' },
  { name: 'Work Desk', icon: 'desktop', productId: 'p9' },
  { name: 'Dining Set', icon: 'restaurant-outline', productId: 'p7' },
];

const DELIVERY_OPTIONS = [
  { key: 'standard', label: 'Standard Delivery', detail: '3–5 working days', fee: 400, icon: 'cube-outline' as const },
  { key: 'express', label: 'Express Delivery', detail: '1–2 working days', fee: 900, icon: 'flash-outline' as const },
  { key: 'pickup', label: 'Pickup Station', detail: 'Collect at nearest station', fee: 0, icon: 'location-outline' as const },
];

// ============ SMALL HELPERS ============

function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Springy entrance wrapper (fade + slide + slight overshoot). */
function Entrance({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      friction: 7,
      tension: 55,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Animated count-up money display. */
function CountUpMoney({ value }: { value: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [value, anim]);
  return <Text style={styles.summaryTotal}>{formatPrice(display)}</Text>;
}

// ============ CART ITEM ROW ============

function CartItemRow({ product, quantity, selected, index }: { product: Product; quantity: number; selected: boolean; index: number }) {
  const { toggleSelected, updateQuantity, toggleSaved, removeItem } = useCart();
  const scale = useRef(new Animated.Value(1)).current;

  const pulse = () => {
    scale.setValue(0.9);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
  };

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <Entrance delay={80 + index * 60}>
      <Animated.View style={[styles.itemRow, { transform: [{ scale }] }]}>
        <Pressable
          onPress={() => {
            hapticLight();
            toggleSelected(product.id);
          }}
          hitSlop={8}
          style={styles.checkbox}
        >
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={selected ? ORANGE : 'rgba(255,255,255,0.35)'}
          />
        </Pressable>

        <Pressable onPress={() => router.push({ pathname: '/ProductDetail', params: { productId: product.id } })} style={styles.itemImageWrap}>
          <Image source={{ uri: product.images[0] }} style={styles.itemImage} />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discount}%</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.itemMetaRow}>
            <Ionicons name="star" size={10} color="#FFB84D" />
            <Text style={styles.itemMeta}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.itemMetaDot}>·</Text>
            <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.4)" />
            <Text style={styles.itemMeta}>{product.location}</Text>
          </View>
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemPrice}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.itemOriginal}>{formatPrice(product.originalPrice)}</Text>
            )}
          </View>

          <View style={styles.itemActionsRow}>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => {
                  pulse();
                  updateQuantity(product.id, -1);
                }}
                hitSlop={6}
                style={styles.stepperBtn}
              >
                <Ionicons name="remove" size={14} color="#fff" />
              </Pressable>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <Pressable
                onPress={() => {
                  pulse();
                  updateQuantity(product.id, 1);
                }}
                hitSlop={6}
                style={styles.stepperBtn}
              >
                <Ionicons name="add" size={14} color="#fff" />
              </Pressable>
            </View>
            <Pressable onPress={() => { hapticLight(); toggleSaved(product.id); }} hitSlop={6} style={styles.textAction}>
              <Text style={styles.textActionLabel}>Save for later</Text>
            </Pressable>
            <Pressable onPress={() => { hapticMedium(); removeItem(product.id); }} hitSlop={6} style={styles.textAction}>
              <Text style={[styles.textActionLabel, { color: 'rgba(255,255,255,0.45)' }]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Entrance>
  );
}

// ============ SELLER GROUP ============

function SellerGroup({ seller, items }: { seller: Seller; items: { product: Product; quantity: number; selected: boolean; addedAt: string }[] }) {
  return (
    <View style={styles.sellerCard}>
      <View style={styles.sellerHeader}>
        <Image source={{ uri: seller.logo }} style={styles.sellerLogo} />
        <View style={styles.sellerHeaderInfo}>
          <View style={styles.sellerNameRow}>
            <Text style={styles.sellerName} numberOfLines={1}>{seller.name}</Text>
            {seller.verified && <Ionicons name="checkmark-circle" size={14} color="#00D4AA" style={{ marginLeft: 4 }} />}
          </View>
          <Text style={styles.sellerMeta}>{items.length} item{items.length > 1 ? 's' : ''} · {seller.location}</Text>
        </View>
        <Pressable
          onPress={() => { hapticLight(); router.push({ pathname: '/Storefront', params: { sellerId: seller.id } }); }}
          hitSlop={8}
          style={styles.sellerViewBtn}
        >
          <Text style={styles.sellerViewText}>View store</Text>
          <Ionicons name="chevron-forward" size={12} color={ORANGE} />
        </Pressable>
      </View>
      {items.map((item, i) => (
        <CartItemRow
          key={item.product.id}
          product={item.product}
          quantity={item.quantity}
          selected={item.selected}
          index={i}
        />
      ))}
    </View>
  );
}

// ============ MAIN SCREEN ============

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const {
    isHydrated, cartProducts, savedProducts, recentlyViewed, lastRemoved, appliedCoupon,
    totals, totalQuantity, selectedQuantity, allSelected, addItem, removeItem, undoRemove,
    toggleAll, removeSelected, toggleSaved, clearCart, applyCoupon, removeCoupon, inCart, cartQuantity,
  } = cart;

  const [plannerExpanded, setPlannerExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [couponSheet, setCouponSheet] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [checkoutState, setCheckoutState] = useState<'review' | 'processing' | 'success'>('review');
  const [deliveryKey, setDeliveryKey] = useState('standard');
  const [orderId, setOrderId] = useState('');

  const toastAnim = useRef(new Animated.Value(0)).current;
  const emptyBob = useRef(new Animated.Value(0)).current;
  const checkoutAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Group by seller ----------
  const groups = useMemo(() => {
    const map = new Map<string, { product: Product; quantity: number; selected: boolean; addedAt: string }[]>();
    for (const item of cart.items) {
      if (item.savedForLater) continue;
      const product = cartProducts.find((p) => p.id === item.productId);
      if (!product) continue;
      const arr = map.get(product.seller.id) ?? [];
      arr.push({ product, quantity: item.quantity, selected: item.selected, addedAt: item.addedAt });
      map.set(product.seller.id, arr);
    }
    return Array.from(map.entries()).map(([sellerId, entries]) => ({
      seller: entries[0].product.seller,
      items: entries.sort((a, b) => a.addedAt.localeCompare(b.addedAt)),
    }));
  }, [cart.items, cartProducts]);

  // ---------- Recommendations ----------
  const recommendations = useMemo(() => {
    const cartCat = new Set(cartProducts.map((p) => p.category));
    const inCartIds = new Set(cart.items.map((i) => i.productId));
    return cartProducts.length > 0
      ? MOCK_PRODUCTS_FOR_RECS.filter((p) => !inCartIds.has(p.id) && cartCat.has(p.category)).slice(0, 8)
      : [];
  }, [cartProducts, cart.items]);

  // ---------- Toast ----------
  const showToast = useCallback((message: string) => {
    setToast(message);
    toastAnim.setValue(0);
    Animated.spring(toastAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
    }, 3200);
  }, [toastAnim]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // ---------- Empty state bob ----------
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emptyBob, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(emptyBob, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [emptyBob]);

  // ---------- Layout animations for add/remove reflow ----------
  const withLayout = (fn: () => void) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    fn();
  };

  // ---------- Move Planner ----------
  const plannerDone = PLANNER_STEPS.filter((s) => inCart(s.productId)).length;
  const plannerPct = plannerDone / PLANNER_STEPS.length;
  const plannerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(plannerAnim, {
      toValue: plannerPct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [plannerPct, plannerAnim]);

  const plannerAdd = (step: PlannerStep) => {
    if (inCart(step.productId)) {
      hapticMedium();
      showToast(`"${step.name}" is already in your cart`);
      return;
    }
    addItem(step.productId, 1);
    hapticSuccess();
    showToast(`Added "${step.name}" to your cart`);
  };

  // ---------- Share / export ----------
  const shareCart = async () => {
    const lines = cartProducts.map((p) => `${p.name} × ${cartQuantity(p.id)} — ${formatPrice(p.price * cartQuantity(p.id))}`);
    const text = `HAMA Smart Cart — ${totalQuantity} item(s)\nTotal: ${formatPrice(totals.total)}\n\n${lines.join('\n')}`;
    await Clipboard.setStringAsync(text);
    hapticSuccess();
    showToast('Cart copied — share it anywhere');
  };

  const exportCart = async () => {
    const lines = cartProducts.map((p) => `${p.name}|${cartQuantity(p.id)}|${p.price}|${formatPrice(p.price * cartQuantity(p.id))}|${p.seller.name}`);
    await Clipboard.setStringAsync(`HAMA Cart Export\n${lines.join('\n')}`);
    hapticSuccess();
    showToast('Cart exported to clipboard (CSV)');
  };

  // ---------- Delivery fee for totals display ----------
  const deliveryFee = deliveryKey === 'express' ? 900 : deliveryKey === 'pickup' ? 0 : 400;
  const freeDeliveryEligible = totals.subtotal >= 10000;
  const effectiveDelivery = freeDeliveryEligible ? 0 : deliveryFee;
  const grandTotal = totals.total - totals.delivery + effectiveDelivery;

  // ---------- Checkout ----------
  const startCheckout = () => {
    if (selectedQuantity === 0) return;
    hapticMedium();
    setCheckoutState('review');
    setCheckout(true);
    checkoutAnim.setValue(0);
    Animated.timing(checkoutAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const confirmPayment = () => {
    hapticLight();
    setCheckoutState('processing');
    setTimeout(() => {
      hapticSuccess();
      setOrderId(`HAMA-${Math.floor(100000 + Math.random() * 900000)}`);
      setCheckoutState('success');
      clearCart();
    }, 1600);
  };

  const closeCheckout = () => {
    Animated.timing(checkoutAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setCheckout(false));
  };

  // ---------- Skeleton ----------
  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.skeletonBar} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonImg} />
            <View style={{ flex: 1 }}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '55%' }]} />
            </View>
          </View>
        ))}
      </SafeAreaView>
    );
  }

  // ---------- Empty state ----------
  if (cartProducts.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Smart Cart</Text>
          <View style={styles.headerBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.emptyWrap} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ transform: [{ translateY: emptyBob.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }] }}>
            <LinearGradient colors={['rgba(255,106,0,0.25)', 'rgba(255,106,0,0.05)']} style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={64} color={ORANGE} />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Everything you add for your next move will live here — furniture, appliances and more.</Text>
          <Pressable onPress={() => { hapticLight(); router.push('/(tabs)/Marketplace'); }} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Start Shopping</Text>
          </Pressable>

          {recentlyViewed.length > 0 && (
            <Entrance delay={200}>
              <Text style={styles.sectionTitle}>Recently viewed</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {recentlyViewed.map((p) => (
                  <Pressable key={p.id} onPress={() => router.push({ pathname: '/ProductDetail', params: { productId: p.id } })} style={styles.recentCard}>
                    <Image source={{ uri: p.images[0] }} style={styles.recentImg} />
                    <Text style={styles.recentName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.recentPrice}>{formatPrice(p.price)}</Text>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); addItem(p.id, 1); hapticSuccess(); showToast('Added to cart'); }}
                      style={styles.recentAdd}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.recentAddText}>Add</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </Entrance>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Main cart view ----------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Smart Cart</Text>
          <Text style={styles.headerSub}>{totalQuantity} item{totalQuantity !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={shareCart} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={exportCart} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="download-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: 90 }}
      >
        {/* ===== Smart Summary ===== */}
        <Entrance>
          <LinearGradient colors={['#2A1705', '#141414']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryLabel}>YOUR SMART SUMMARY</Text>
                <CountUpMoney value={grandTotal} />
                <Text style={styles.summaryItems}>
                  {selectedQuantity} of {totalQuantity} item{totalQuantity !== 1 ? 's' : ''} selected
                </Text>
              </View>
              <View style={styles.summaryRight}>
                {totals.savings > 0 && (
                  <View style={styles.savingsPill}>
                    <Ionicons name="trending-down" size={12} color="#00D4AA" />
                    <Text style={styles.savingsPillText}>You save {formatPrice(totals.savings)}</Text>
                  </View>
                )}
                {appliedCoupon && (
                  <View style={styles.couponPill}>
                    <Ionicons name="pricetag" size={12} color={ORANGE} />
                    <Text style={styles.couponPillText}>{appliedCoupon.code} applied</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.freeDeliveryRow}>
              <View style={styles.freeDeliveryTextRow}>
                <Ionicons name="bicycle" size={13} color="rgba(255,255,255,0.6)" />
                <Text style={styles.freeDeliveryText}>
                  {freeDeliveryEligible
                    ? 'Free delivery unlocked'
                    : `Add ${formatPrice(10000 - totals.subtotal)} more for free delivery`}
                </Text>
              </View>
              <View style={styles.freeDeliveryTrack}>
                <Animated.View
                  style={[
                    styles.freeDeliveryFill,
                    {
                      width: freeDeliveryEligible ? '100%' : `${Math.min(100, (totals.subtotal / 10000) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </Entrance>

        {/* ===== Move Planner ===== */}
        <Entrance delay={90}>
          <View style={styles.plannerCard}>
            <View style={styles.plannerHeader}>
              <View style={styles.plannerTitleRow}>
                <View style={styles.plannerIcon}>
                  <Ionicons name="map-outline" size={18} color={ORANGE} />
                </View>
                <View>
                  <Text style={styles.plannerTitle}>Move Planner</Text>
                  <Text style={styles.plannerSub}>Tap essentials to add them to your cart</Text>
                </View>
              </View>
              <Text style={styles.plannerCount}>{plannerDone}/{PLANNER_STEPS.length}</Text>
            </View>
            <View style={styles.plannerTrack}>
              <Animated.View style={[styles.plannerFill, { width: plannerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <View style={styles.plannerGrid}>
              {(plannerExpanded ? PLANNER_STEPS : PLANNER_STEPS.slice(0, 8)).map((step) => {
                const done = inCart(step.productId);
                return (
                  <Pressable
                    key={step.productId}
                    onPress={() => plannerAdd(step)}
                    style={[styles.plannerItem, done && styles.plannerItemDone]}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : step.icon}
                      size={16}
                      color={done ? '#00D4AA' : 'rgba(255,255,255,0.85)'}
                    />
                    <Text style={[styles.plannerItemText, done && styles.plannerItemTextDone]} numberOfLines={1}>{step.name}</Text>
                    {!done && (
                      <View style={styles.plannerPlus}>
                        <Ionicons name="add" size={10} color={ORANGE} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => { hapticLight(); setPlannerExpanded((v) => !v); }} style={styles.plannerMore}>
              <Text style={styles.plannerMoreText}>{plannerExpanded ? 'Show less' : `See all ${PLANNER_STEPS.length} essentials`}</Text>
              <Ionicons name={plannerExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={ORANGE} />
            </Pressable>
          </View>
        </Entrance>

        {/* ===== Multi-select toolbar ===== */}
        <Entrance delay={140}>
          <View style={styles.toolbar}>
            <Pressable onPress={() => toggleAll(!allSelected)} style={styles.toolbarLeft} hitSlop={8}>
              <Ionicons
                name={allSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={allSelected ? ORANGE : 'rgba(255,255,255,0.35)'}
              />
              <Text style={styles.toolbarSelectText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
            </Pressable>
            <Pressable onPress={() => { withLayout(() => removeSelected()); }} style={styles.toolbarRight} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.toolbarDeleteText}>Delete selected</Text>
            </Pressable>
          </View>
        </Entrance>

        {/* ===== Seller groups ===== */}
        {groups.map((g, gi) => (
          <SellerGroup key={g.seller.id} seller={g.seller} items={g.items} />
        ))}

        {/* ===== Saved for later ===== */}
        {savedProducts.length > 0 && (
          <Entrance delay={200}>
            <Text style={styles.sectionTitle}>Saved for later ({savedProducts.length})</Text>
            <View style={styles.savedCard}>
              {savedProducts.map((p) => (
                <View key={p.id} style={styles.savedRow}>
                  <Image source={{ uri: p.images[0] }} style={styles.savedImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.savedPrice}>{formatPrice(p.price)}</Text>
                  </View>
                  <Pressable onPress={() => { withLayout(() => toggleSaved(p.id)); hapticSuccess(); showToast('Moved back to cart'); }} hitSlop={8} style={styles.savedMoveBtn}>
                    <Ionicons name="cart-outline" size={14} color={ORANGE} />
                    <Text style={styles.savedMoveText}>Move to cart</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </Entrance>
        )}

        {/* ===== Price breakdown ===== */}
        <Entrance delay={220}>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Price details</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal ({totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''})</Text>
              <Text style={styles.breakdownValue}>{formatPrice(totals.subtotal)}</Text>
            </View>
            {totals.savings > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Discount</Text>
                <Text style={[styles.breakdownValue, { color: '#00D4AA' }]}>− {formatPrice(totals.savings)}</Text>
              </View>
            )}
            {appliedCoupon && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Coupon ({appliedCoupon.code})</Text>
                <Text style={[styles.breakdownValue, { color: '#00D4AA' }]}>− {formatPrice(totals.discount)}</Text>
              </View>
            )}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Delivery</Text>
              <Text style={[styles.breakdownValue, effectiveDelivery === 0 && { color: '#00D4AA' }]}>
                {effectiveDelivery === 0 ? 'FREE' : formatPrice(effectiveDelivery)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>VAT (16%)</Text>
              <Text style={styles.breakdownValue}>{formatPrice(totals.tax)}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
              <Text style={styles.breakdownTotalValue}>{formatPrice(grandTotal)}</Text>
            </View>
          </View>
        </Entrance>

        {/* ===== Coupons ===== */}
        <Entrance delay={260}>
          <Pressable onPress={() => { hapticLight(); setCouponSheet(true); }} style={styles.linkCard}>
            <View style={styles.linkCardLeft}>
              <View style={styles.linkCardIcon}>
                <Ionicons name="pricetag-outline" size={18} color={ORANGE} />
              </View>
              <View>
                <Text style={styles.linkCardTitle}>{appliedCoupon ? `Coupon ${appliedCoupon.code} applied` : 'Apply a coupon'}</Text>
                <Text style={styles.linkCardSub}>
                  {appliedCoupon ? appliedCoupon.description : `${AVAILABLE_COUPONS.length} coupons available · up to 25% off`}
                </Text>
              </View>
            </View>
            {appliedCoupon ? (
              <Pressable onPress={() => { hapticLight(); removeCoupon(); showToast('Coupon removed'); }} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
              </Pressable>
            ) : (
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
            )}
          </Pressable>
        </Entrance>

        {/* ===== Delivery ===== */}
        <Entrance delay={280}>
          <View style={styles.linkCard}>
            <View style={styles.linkCardLeft}>
              <View style={styles.linkCardIcon}>
                <Ionicons name="cube-outline" size={18} color={ORANGE} />
              </View>
              <View>
                <Text style={styles.linkCardTitle}>Delivery options</Text>
                <Text style={styles.linkCardSub}>{DELIVERY_OPTIONS.find((o) => o.key === deliveryKey)?.label}</Text>
              </View>
            </View>
            <View style={styles.deliveryOptions}>
              {DELIVERY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => { hapticLight(); setDeliveryKey(opt.key); }}
                  style={[styles.deliveryOption, deliveryKey === opt.key && styles.deliveryOptionActive]}
                >
                  <Ionicons name={opt.icon} size={13} color={deliveryKey === opt.key ? ORANGE : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.deliveryOptionText, deliveryKey === opt.key && { color: '#fff' }]}>{opt.label}</Text>
                  <Text style={[styles.deliveryOptionFee, deliveryKey === opt.key && { color: ORANGE }]}>
                    {opt.fee === 0 ? 'Free' : formatPrice(opt.fee)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Entrance>

        {/* ===== Payment preview ===== */}
        <Entrance delay={320}>
          <Pressable onPress={() => router.push('/PaymentMethods')} style={styles.linkCard}>
            <View style={styles.linkCardLeft}>
              <View style={styles.linkCardIcon}>
                <Ionicons name="wallet-outline" size={18} color={ORANGE} />
              </View>
              <View>
                <Text style={styles.linkCardTitle}>Payment method</Text>
                <Text style={styles.linkCardSub}>M-Pesa •••• 4242 · Pay with {formatPrice(grandTotal)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </Entrance>

        {/* ===== Recommendations ===== */}
        {recommendations.length > 0 && (
          <Entrance delay={340}>
            <Text style={styles.sectionTitle}>You might also like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {recommendations.map((p) => (
                <Pressable key={p.id} onPress={() => router.push({ pathname: '/ProductDetail', params: { productId: p.id } })} style={styles.recCard}>
                  <Image source={{ uri: p.images[0] }} style={styles.recImg} />
                  <Text style={styles.recName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.recPrice}>{formatPrice(p.price)}</Text>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); addItem(p.id, 1); hapticSuccess(); showToast('Added to cart'); }}
                    style={styles.recAdd}
                  >
                    <Ionicons name="add" size={14} color="#fff" />
                    <Text style={styles.recAddText}>Add</Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </Entrance>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ===== Bottom checkout bar ===== */}
      <Entrance delay={150} style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.checkoutBarLabel}>
            {selectedQuantity} item{selectedQuantity !== 1 ? 's' : ''} · {totals.itemCount} in cart
          </Text>
          <CountUpMoney value={grandTotal} />
        </View>
        <Pressable
          onPress={startCheckout}
          disabled={selectedQuantity === 0}
          style={[styles.checkoutBtn, selectedQuantity === 0 && { opacity: 0.4 }]}
        >
          <Text style={styles.checkoutBtnText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </Entrance>

      {/* ===== Undo toast ===== */}
      {lastRemoved && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]} pointerEvents="box-none">
          <View style={styles.toastRow}>
            <Ionicons name="trash-outline" size={14} color="#fff" />
            <Text style={styles.toastText} numberOfLines={1}>Removed "{lastRemoved.product.name}"</Text>
            <Pressable onPress={() => { withLayout(() => undoRemove()); hapticSuccess(); }} hitSlop={8} style={styles.undoBtn}>
              <Text style={styles.undoText}>Undo</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* ===== Success toast (transient messages) ===== */}
      {toast && !lastRemoved && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]} pointerEvents="box-none">
          <View style={styles.toastRow}>
            <Ionicons name="checkmark-circle" size={14} color="#00D4AA" />
            <Text style={styles.toastText} numberOfLines={1}>{toast}</Text>
          </View>
        </Animated.View>
      )}

      {/* ===== Coupon sheet ===== */}
      <Modal visible={couponSheet} transparent animationType="none" onRequestClose={() => setCouponSheet(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setCouponSheet(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={styles.sheetTitle}>Coupons</Text>
                <Text style={styles.sheetSub}>Select a coupon to apply at checkout</Text>
              </View>
              <Pressable onPress={() => setCouponSheet(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>
            {AVAILABLE_COUPONS.map((c) => {
              const eligible = totals.subtotal >= c.minSubtotal;
              const applied = appliedCoupon?.code === c.code;
              return (
                <Pressable
                  key={c.code}
                  disabled={!eligible}
                  onPress={() => {
                    applyCoupon(c.code);
                    setCouponSheet(false);
                    showToast(`Coupon ${c.code} applied — you save ${formatPrice(totals.discount)}`);
                  }}
                  style={[styles.couponRow, !eligible && { opacity: 0.35 }]}
                >
                  <View style={styles.couponCodeBox}>
                    <Ionicons name="pricetag" size={16} color={ORANGE} />
                    <Text style={styles.couponCode}>{c.code}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.couponDesc}>{c.description}</Text>
                    <Text style={styles.couponMin}>{eligible ? 'Eligible' : `Minimum order ${formatPrice(c.minSubtotal)}`}</Text>
                  </View>
                  {applied ? (
                    <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                  ) : (
                    <View style={styles.couponApply}>
                      <Text style={styles.couponApplyText}>Apply</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== Checkout flow ===== */}
      <Modal visible={checkout} transparent animationType="none" onRequestClose={closeCheckout}>
        <View style={styles.sheetBackdrop}>
          <Animated.View
            style={[
              styles.checkoutSheet,
              { paddingBottom: Math.max(insets.bottom, 16), opacity: checkoutAnim, transform: [{ translateY: checkoutAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] },
            ]}
          >
            {checkoutState === 'review' && (
              <>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Checkout</Text>
                <View style={styles.checkoutSummaryCard}>
                  <View style={styles.checkoutSummaryRow}>
                    <Text style={styles.breakdownLabel}>Items ({selectedQuantity})</Text>
                    <Text style={styles.breakdownValue}>{formatPrice(totals.subtotal)}</Text>
                  </View>
                  <View style={styles.checkoutSummaryRow}>
                    <Text style={styles.breakdownLabel}>Delivery</Text>
                    <Text style={[styles.breakdownValue, effectiveDelivery === 0 && { color: '#00D4AA' }]}>
                      {effectiveDelivery === 0 ? 'FREE' : formatPrice(effectiveDelivery)}
                    </Text>
                  </View>
                  <View style={styles.checkoutSummaryRow}>
                    <Text style={styles.breakdownLabel}>VAT (16%)</Text>
                    <Text style={styles.breakdownValue}>{formatPrice(totals.tax)}</Text>
                  </View>
                  {totals.discount > 0 && (
                    <View style={styles.checkoutSummaryRow}>
                      <Text style={styles.breakdownLabel}>Coupon ({appliedCoupon?.code})</Text>
                      <Text style={[styles.breakdownValue, { color: '#00D4AA' }]}>− {formatPrice(totals.discount)}</Text>
                    </View>
                  )}
                  <View style={styles.breakdownDivider} />
                  <View style={styles.checkoutSummaryRow}>
                    <Text style={styles.breakdownTotalLabel}>Total due</Text>
                    <Text style={[styles.breakdownTotalValue, { color: ORANGE }]}>{formatPrice(grandTotal)}</Text>
                  </View>
                </View>
                <View style={styles.payMethodRow}>
                  <View style={styles.linkCardIcon}>
                    <Ionicons name="phone-portrait-outline" size={16} color={ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMethodName}>M-Pesa</Text>
                    <Text style={styles.payMethodDetail}>+254 7•• ••• 424 · paybill 427711</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#00D4AA" />
                </View>
                <Pressable onPress={confirmPayment} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Pay {formatPrice(grandTotal)}</Text>
                </Pressable>
                <Pressable onPress={closeCheckout} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </>
            )}

            {checkoutState === 'processing' && (
              <View style={styles.processingWrap}>
                <Animated.View style={styles.spinner}>
                  <Ionicons name="hourglass-outline" size={36} color={ORANGE} />
                </Animated.View>
                <Text style={styles.processingText}>Processing your payment…</Text>
                <Text style={styles.processingSub}>Confirming with M-Pesa</Text>
              </View>
            )}

            {checkoutState === 'success' && (
              <View style={styles.processingWrap}>
                <AnimatedSuccess />
                <Text style={styles.successTitle}>Order placed!</Text>
                <Text style={styles.successSub}>
                  Order {orderId} has been confirmed. Your move essentials are on their way.
                </Text>
                <View style={styles.orderIdPill}>
                  <Text style={styles.orderIdText}>{orderId}</Text>
                </View>
                <Pressable
                  onPress={() => { setCheckout(false); }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Continue Shopping</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setCheckout(false); router.push('/(tabs)/Profile'); }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Track order</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Pop-in checkmark for order success. */
function AnimatedSuccess() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  }, [anim]);
  return (
    <Animated.View
      style={[
        styles.successCircle,
        {
          transform: [
            { scale: anim },
            { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
          ],
        },
      ]}
    >
      <Ionicons name="checkmark" size={44} color="#fff" />
    </Animated.View>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: 4, paddingBottom: 24 },

  // Summary
  summaryCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.25)',
    marginBottom: SPACING.md,
  },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,106,0,0.9)', letterSpacing: 1.5, marginBottom: 6 },
  summaryTotal: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  summaryItems: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  summaryRight: { alignItems: 'flex-end', gap: 6 },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,212,170,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savingsPillText: { fontSize: 11, fontWeight: '600', color: '#00D4AA' },
  couponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,106,0,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  couponPillText: { fontSize: 11, fontWeight: '600', color: ORANGE },
  freeDeliveryRow: { marginTop: SPACING.md },
  freeDeliveryTextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  freeDeliveryText: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  freeDeliveryTrack: { height: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  freeDeliveryFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: ORANGE },

  // Move Planner
  plannerCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  plannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,106,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  plannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  plannerCount: { fontSize: 13, fontWeight: '800', color: ORANGE },
  plannerTrack: { height: 5, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 12 },
  plannerFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: ORANGE },
  plannerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  plannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: SURFACE2,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  plannerItemDone: {
    backgroundColor: 'rgba(0,212,170,0.1)',
    borderColor: 'rgba(0,212,170,0.3)',
  },
  plannerItemText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', maxWidth: 110 },
  plannerItemTextDone: { color: '#00D4AA', textDecorationLine: 'line-through' },
  plannerPlus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,106,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingVertical: 4 },
  plannerMoreText: { fontSize: 12, fontWeight: '600', color: ORANGE },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
    marginHorizontal: 2,
  },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toolbarSelectText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarDeleteText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  // Seller card
  sellerCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 4,
  },
  sellerLogo: { width: 36, height: 36, borderRadius: 12 },
  sellerHeaderInfo: { flex: 1 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center' },
  sellerName: { fontSize: 13, fontWeight: '700', color: '#fff', flexShrink: 1 },
  sellerMeta: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  sellerViewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sellerViewText: { fontSize: 11, fontWeight: '600', color: ORANGE },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  checkbox: { width: 24, alignItems: 'center', justifyContent: 'center' },
  itemImageWrap: { position: 'relative' },
  itemImage: { width: 84, height: 84, borderRadius: RADIUS.md, backgroundColor: SURFACE2 },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#E5484D',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  discountBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#fff', lineHeight: 17 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  itemMeta: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  itemMetaDot: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginHorizontal: 2 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#fff' },
  itemOriginal: { fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecorationLine: 'line-through' },
  itemActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepperBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 13, fontWeight: '700', color: '#fff', minWidth: 22, textAlign: 'center' },
  textAction: { paddingVertical: 2 },
  textActionLabel: { fontSize: 11, fontWeight: '500', color: '#FFB84D' },

  // Saved
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: SPACING.md, marginBottom: 10, paddingHorizontal: 2 },
  savedCard: { backgroundColor: SURFACE, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  savedImg: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: SURFACE2 },
  savedPrice: { fontSize: 12, fontWeight: '700', color: '#fff', marginTop: 2 },
  savedMoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.4)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedMoveText: { fontSize: 11, fontWeight: '600', color: ORANGE },

  // Breakdown
  breakdownCard: { backgroundColor: SURFACE, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  breakdownTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  breakdownLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  breakdownValue: { fontSize: 12, fontWeight: '600', color: '#fff' },
  breakdownDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  breakdownTotalLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  breakdownTotalValue: { fontSize: 17, fontWeight: '800', color: '#fff' },

  // Link cards (coupons / delivery / payment)
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  linkCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  linkCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,106,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCardTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  linkCardSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  deliveryOptions: { flexDirection: 'column', gap: 6 },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE2,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  deliveryOptionActive: { borderColor: 'rgba(255,106,0,0.6)', backgroundColor: 'rgba(255,106,0,0.08)' },
  deliveryOptionText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  deliveryOptionFee: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  // Recommendations
  hScroll: { paddingRight: SPACING.md, gap: 10 },
  recCard: { width: 132, backgroundColor: SURFACE, borderRadius: RADIUS.lg, padding: 8, gap: 4 },
  recImg: { width: '100%', height: 92, borderRadius: RADIUS.md, backgroundColor: SURFACE2 },
  recName: { fontSize: 11, color: '#fff', fontWeight: '600', marginTop: 2 },
  recPrice: { fontSize: 12, fontWeight: '800', color: '#fff' },
  recAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: ORANGE,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    marginTop: 2,
  },
  recAddText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Recent (empty state)
  recentCard: { width: 120, backgroundColor: SURFACE, borderRadius: RADIUS.lg, padding: 8, gap: 4 },
  recentImg: { width: '100%', height: 80, borderRadius: RADIUS.md, backgroundColor: SURFACE2 },
  recentName: { fontSize: 11, color: '#fff', fontWeight: '600' },
  recentPrice: { fontSize: 12, fontWeight: '800', color: '#fff' },
  recentAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.5)',
    borderRadius: RADIUS.full,
    paddingVertical: 5,
    marginTop: 2,
  },
  recentAddText: { fontSize: 11, fontWeight: '700', color: ORANGE },

  // Bottom bar
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  checkoutBarLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: RADIUS.full,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  checkoutBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Toast
  toast: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: 96,
    backgroundColor: SURFACE2,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toastRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toastText: { flex: 1, fontSize: 12, color: '#fff' },
  undoBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  undoText: { fontSize: 12, fontWeight: '800', color: ORANGE },

  // Empty
  emptyWrap: { flexGrow: 1, alignItems: 'center', paddingTop: 70, paddingHorizontal: SPACING.xl },
  emptyIconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  // Buttons
  primaryBtn: {
    backgroundColor: ORANGE,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    alignSelf: 'stretch',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cancelBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 4 },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // Sheets
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#101012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: '#fff' },
  sheetSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
  },
  couponCodeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 96 },
  couponCode: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  couponDesc: { fontSize: 12, color: '#fff', fontWeight: '600' },
  couponMin: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  couponApply: {
    backgroundColor: ORANGE,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  couponApplyText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // Checkout
  checkoutSheet: {
    backgroundColor: '#101012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  checkoutSummaryCard: { backgroundColor: SURFACE, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: 16 },
  checkoutSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  payMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  payMethodName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  payMethodDetail: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  processingWrap: { alignItems: 'center', paddingVertical: 40 },
  spinner: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,106,0,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  processingText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  processingSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  successSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 16 },
  orderIdPill: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 24,
  },
  orderIdText: { fontSize: 13, fontWeight: '800', color: ORANGE, letterSpacing: 1 },

  // Skeletons
  skeletonBar: { height: 28, width: 140, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' },
  skeletonCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  skeletonImg: { width: 72, height: 72, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.06)' },
  skeletonLine: { height: 12, width: '85%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10 },
});
