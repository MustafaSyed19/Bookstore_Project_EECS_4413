import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, productApi } from '../api/api';

const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

let paymentCounter = 0;

export function AppProvider({ children }) {
  const navigate = useNavigate();

  const [token, setToken] = useState(() => {
    try { return sessionStorage.getItem('bk_token'); } catch { return null; }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('bk_user')); } catch { return null; }
  });

  // Guest cart
  const [guestCart, setGuestCart] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('bk_guest_cart')) || []; } catch { return []; }
  });

  const [cartCount, setCartCount] = useState(0);
  const [toastMsg, setToastMsg] = useState(null);

  // Orders — localStorage for durability across sessions
  const [orderHistory, setOrderHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bk_orders')) || []; } catch { return []; }
  });

  // Inventory change log — localStorage for durability
  const [inventoryLog, setInventoryLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bk_inv_log')) || []; } catch { return []; }
  });

  // Credit card — localStorage per user key
  const [savedCard, setSavedCard] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bk_card')) || null; } catch { return null; }
  });

  const toast = useCallback((msg, type = 'success') => setToastMsg({ msg, type }), []);
  const clearToast = useCallback(() => setToastMsg(null), []);

  // ── Guest cart ──
  const saveGuestCart = (items) => {
    setGuestCart(items);
    try { sessionStorage.setItem('bk_guest_cart', JSON.stringify(items)); } catch {}
  };

  const addToGuestCart = useCallback((product, qty = 1) => {
    setGuestCart(prev => {
      const existing = prev.find(i => i.bookId === product.id);
      let updated;
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > product.quantity) {
          toast(`Only ${product.quantity} in stock`, 'error');
          return prev;
        }
        updated = prev.map(i => i.bookId === product.id ? { ...i, quantity: newQty } : i);
      } else {
        if (qty > product.quantity) {
          toast(`Only ${product.quantity} in stock`, 'error');
          return prev;
        }
        updated = [...prev, {
          bookId: product.id, quantity: qty,
          title: product.title, price: product.price,
          imageUrl: product.imageUrl, inventory: product.quantity,
        }];
      }
      try { sessionStorage.setItem('bk_guest_cart', JSON.stringify(updated)); } catch {}
      return updated;
    });
    toast('Added to cart!', 'success');
  }, [toast]);

  const updateGuestCartQty = useCallback((bookId, quantity) => {
    setGuestCart(prev => {
      const item = prev.find(i => i.bookId === bookId);
      if (item && quantity > item.inventory) {
        toast(`Only ${item.inventory} in stock`, 'error');
        return prev;
      }
      const updated = prev.map(i => i.bookId === bookId ? { ...i, quantity } : i);
      try { sessionStorage.setItem('bk_guest_cart', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [toast]);

  const removeFromGuestCart = useCallback((bookId) => {
    setGuestCart(prev => {
      const updated = prev.filter(i => i.bookId !== bookId);
      try { sessionStorage.setItem('bk_guest_cart', JSON.stringify(updated)); } catch {}
      return updated;
    });
    toast('Item removed', 'success');
  }, [toast]);

  const clearGuestCart = useCallback(() => {
    saveGuestCart([]);
    toast('Cart cleared', 'success');
  }, [toast]);

  const getGuestCartTotal = useCallback(() => {
    return guestCart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  }, [guestCart]);

  // ── Logged-in add-to-cart with stock check ──
  const addToServerCart = useCallback(async (bookId, qty, tkn) => {
    try {
      const product = await productApi.getById(bookId);
      if (product.quantity < qty) {
        toast(`Only ${product.quantity} in stock for "${product.title}"`, 'error');
        return false;
      }
      await cartApi.add(bookId, qty, tkn);
      toast('Added to cart!', 'success');
      return true;
    } catch (e) { toast(e.message, 'error'); return false; }
  }, [toast]);

  // ── Logged-in cart update with stock check ──
  const updateServerCartQty = useCallback(async (bookId, newQty, tkn) => {
    try {
      const product = await productApi.getById(bookId);
      if (product.quantity < newQty) {
        toast(`Only ${product.quantity} in stock for "${product.title}"`, 'error');
        return false;
      }
      await cartApi.update(bookId, newQty, tkn);
      return true;
    } catch (e) { toast(e.message, 'error'); return false; }
  }, [toast]);

  // ── Auth ──
  const login = useCallback(async (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      sessionStorage.setItem('bk_token', newToken);
      sessionStorage.setItem('bk_user', JSON.stringify(newUser));
    } catch {}
    // Sync guest cart to server
    const gc = JSON.parse(sessionStorage.getItem('bk_guest_cart') || '[]');
    if (gc.length > 0) {
      for (const item of gc) {
        try { await cartApi.add(item.bookId, item.quantity, newToken); } catch {}
      }
      saveGuestCart([]);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null); setUser(null); setCartCount(0);
    try {
      sessionStorage.removeItem('bk_token');
      sessionStorage.removeItem('bk_user');
    } catch {}
    navigate('/');
  }, [navigate]);

  // ── Cart count ──
  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartCount(guestCart.reduce((s, i) => s + i.quantity, 0));
      return;
    }
    try {
      const data = await cartApi.get(token);
      setCartCount(data.items?.reduce((s, i) => s + i.quantity, 0) || 0);
    } catch { setCartCount(0); }
  }, [token, guestCart]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  // ── Payment: deny every 3rd ──
  const simulatePayment = useCallback(() => {
    paymentCounter++;
    return paymentCounter % 3 === 0
      ? { approved: false }
      : { approved: true };
  }, []);

  // ── Orders (localStorage) ──
  const addOrder = useCallback((order) => {
    setOrderHistory(prev => {
      const updated = [order, ...prev];
      try { localStorage.setItem('bk_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // ── Inventory log (localStorage) ──
  const addInventoryLogEntry = useCallback((entry) => {
    setInventoryLog(prev => {
      const updated = [{ ...entry, date: new Date().toISOString() }, ...prev];
      try { localStorage.setItem('bk_inv_log', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // ── Card (localStorage) ──
  const saveCardInfo = useCallback((cardInfo) => {
    setSavedCard(cardInfo);
    try { localStorage.setItem('bk_card', JSON.stringify(cardInfo)); } catch {}
  }, []);

  const value = {
    token, user, cartCount, toastMsg, orderHistory, savedCard,
    guestCart, getGuestCartTotal, inventoryLog,
    login, logout, toast, clearToast, refreshCart,
    simulatePayment, addOrder, saveCardInfo, addInventoryLogEntry,
    addToGuestCart, updateGuestCartQty, removeFromGuestCart, clearGuestCart,
    addToServerCart, updateServerCartQty,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
