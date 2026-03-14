import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-background border-t border-gray-800/60 pt-12 pb-6 px-3">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
        
        {/* Columna 1: Brand */}
        <div className="flex flex-col gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight mb-1">
            Delega<span className="text-primary">Web</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Tu partner digital. Creamos, optimizamos y gestionamos tu presencia online con enfoque en resultados.
          </p>
        </div>

        {/* Columna 2: Contacto */}
        <div className="flex flex-col gap-3 text-sm">
          <h4 className="font-bold text-base mb-1 text-primary">Contacto</h4>
          <div className="flex items-center gap-2 text-gray-400">
            <Mail className="w-4 h-4 text-primary" />
            <a href="mailto:info@delegaweb.com" className="hover:text-white transition-colors">info@delegaweb.com</a>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Phone className="w-4 h-4 text-primary" />
            <span>+34 600 000 000</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4 text-primary" />
            <span>España</span>
          </div>
        </div>

        {/* Columna 3: Políticas */}
        <div className="flex flex-col gap-2 text-sm">
          <h4 className="font-bold text-base mb-1 text-primary">Políticas</h4>
          <Link to="/politica-de-privacidad" className="text-gray-400 hover:text-white transition-colors">Política de privacidad</Link>
          <Link to="/politica-de-cookies" className="text-gray-400 hover:text-white transition-colors">Política de cookies</Link>
          <Link to="/descargos-de-responsabilidad" className="text-gray-400 hover:text-white transition-colors">Descargos de responsabilidad</Link>
          <Link to="/terminos-y-condiciones" className="text-gray-400 hover:text-white transition-colors">Términos y condiciones</Link>
          <Link to="/trabaja-con-nosotros" className="text-gray-400 hover:text-white transition-colors">Trabaja con nosotros</Link>
          <Link to="/copyright" className="text-gray-400 hover:text-white transition-colors">Copyright</Link>
          <Link to="/politica-de-reembolsos" className="text-gray-400 hover:text-white transition-colors">Política de devoluciones y reembolsos</Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-800/60 pt-6 mt-6 text-center">
        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} DelegaWeb. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
