import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LegalConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('delega_cookie_consent');
    if (!consent) {
      // Pequeño delay para una entrada más elegante
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('delega_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl transition-all duration-500 animate-slide-up">
      <div className="bg-cardbg/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Valoramos tu privacidad</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Utilizamos cookies propias para mejorar tu experiencia y ofrecerte nuestros servicios de desarrollo web.
            Al continuar navegando, aceptas nuestra{' '}
            <Link to="/politica-de-cookies" className="text-primary hover:underline font-medium">
              política de cookies
            </Link>.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-8 py-3 bg-primary hover:bg-primaryhover text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalConsent;
