import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface CartProduct {
  name: string;
  price: number;
  [key: string]: unknown;
}

interface CartContextValue {
  cartItems: CartProduct[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productName: string) => void;
  clearCart: () => void;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartProduct[]>(() => {
    try {
      const saved = sessionStorage.getItem('delegaweb_cart');
      return saved ? (JSON.parse(saved) as CartProduct[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('delegaweb_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: CartProduct) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.name === product.name);
      if (exists) return prev;
      return [...prev, product];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productName: string) => {
    setCartItems(prev => prev.filter(item => item.name !== productName));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, clearCart,
      cartTotal, isCartOpen, setIsCartOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}
