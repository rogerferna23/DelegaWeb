import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('delegaweb_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('delegaweb_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prev => {
      // Check if item already exists to avoid exact duplicates (same product name and price)
      // For services, they might just want one of each, so let's just add it if it doesn't exist.
      const exists = prev.find(item => item.name === product.name);
      if (exists) {
        // We could just return the previous cart, or alert them. We'll just return it.
        return prev;
      }
      return [...prev, product];
    });
    setIsCartOpen(true); // Auto-open cart when adding
  };

  const removeFromCart = (productName) => {
    setCartItems(prev => prev.filter(item => item.name !== productName));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}
