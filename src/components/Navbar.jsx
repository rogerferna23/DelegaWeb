import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Menu, X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import PayPalCheckout from './PayPalCheckout';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, cartTotal, clearCart } = useCart();

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md">
        {/* Barra principal */}
        <div className="relative flex items-center justify-between py-3 px-3">
          {/* Logo */}
          <a href="/" className="text-xl font-bold tracking-tight">
            Delega<span className="text-primary">Web</span>
          </a>

          {/* Links escritorio — centrados absolutamente */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-gray-400 text-xs font-medium">
            <a href="#servicios" className="hover:text-white transition-all duration-300">Servicios</a>
            <a href="#proceso" className="hover:text-white transition-all duration-300">Proceso</a>
            <a href="#testimonios" className="hover:text-white transition-all duration-300">Testimonios</a>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors duration-300"
              aria-label="Ver carrito"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white shadow-lg">
                  {cartItems.length}
                </span>
              )}
            </button>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/admin/login"
                className="flex items-center gap-1.5 border border-white/10 hover:border-primary/50 text-gray-400 hover:text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </Link>
              <a 
                href="https://wa.me/34711208967?text=Hola%20Sofía,%20vengo%20de%20la%20web%20y%20quiero%20recibir%20mi%20asesoría%20gratuita" 
                className="bg-primary hover:bg-primaryhover text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 text-xs shadow-md shadow-primary/10"
              >
                Asesoría Gratuita
              </a>
            </div>

            {/* Botón hamburguesa — solo móvil */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-primary/50 transition-all duration-300 ml-1"
              aria-label="Abrir menú"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-5 pt-2 flex flex-col gap-3 border-t border-white/5">
            <a href="#servicios" onClick={closeMenu} className="text-gray-400 hover:text-white text-sm py-2 transition-colors duration-200">Servicios</a>
            <a href="#proceso" onClick={closeMenu} className="text-gray-400 hover:text-white text-sm py-2 transition-colors duration-200">Proceso</a>
            <a href="#testimonios" onClick={closeMenu} className="text-gray-400 hover:text-white text-sm py-2 transition-colors duration-200">Testimonios</a>
            <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
              <Link to="/admin/login" onClick={closeMenu} className="flex items-center justify-center gap-1.5 border border-white/10 text-gray-400 px-4 py-2.5 rounded-lg font-medium text-xs transition-all duration-300 hover:border-primary/50 hover:text-white">
                <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión
              </Link>
              <a 
                href="https://wa.me/34711208967?text=Hola%20Sofía,%20vengo%20de%20la%20web%20y%20quiero%20recibir%20mi%20asesoría%20gratuita" 
                onClick={closeMenu} 
                className="bg-primary hover:bg-primaryhover text-white text-center px-5 py-2.5 rounded-lg font-medium text-xs transition-all duration-300 shadow-md shadow-primary/10"
              >
                Asesoría Gratuita
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-cardbg border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Tu Carrito
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <ShoppingCart className="w-12 h-12 mb-4 text-gray-500" />
                  <p className="text-sm text-gray-400">Tu carrito está vacío</p>
                  <p className="text-xs text-gray-500 mt-2">Agrega servicios para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex items-start justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                        <span className="inline-block mt-2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                          ${item.price} USD
                        </span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.name)}
                        className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-background/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Total a pagar</span>
                  <span className="text-xl font-bold text-white">${cartTotal.toLocaleString()} USD</span>
                </div>
                <button 
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primaryhover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  Ir a Pagar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {isCheckingOut && (
        <PayPalCheckout
          cartItems={cartItems}
          cartTotal={cartTotal}
          onClose={() => setIsCheckingOut(false)}
          onSuccess={() => {
            clearCart();
            setIsCartOpen(false);
          }}
        />
      )}
    </>
  );
};

export default Navbar;
