import { type ReactElement } from 'react';
import {
  Zap, LayoutDashboard, ShoppingCart, Megaphone,
  Wrench, Users, Rocket, Package,
} from 'lucide-react';

export interface Service {
  id:         string;
  name:       string;
  category:   string;
  price:      number;
  icon:       ReactElement;
  isPremium:  boolean;
  isMonthly?: boolean;
  highlight?: boolean;
}

export const SERVICES_CATALOG: Service[] = [
  { id: 'landing-pages',  name: 'Landing Pages',                     category: 'Web',          price: 299,  icon: <Zap />,           isPremium: false },
  { id: 'web-admin',      name: 'Web con panel de administración',    category: 'Web',          price: 499,  icon: <LayoutDashboard />, isPremium: false },
  { id: 'ecommerce',      name: 'Ecommerce',                          category: 'Web',          price: 999,  icon: <ShoppingCart />,   isPremium: false, highlight: true },
  { id: 'campanas',       name: 'Campañas publicitarias',             category: 'Marketing',    price: 299,  icon: <Megaphone />,      isPremium: false, isMonthly: true },
  { id: 'mantenimiento',  name: 'Mantenimiento web',                  category: 'Web',          price: 25,   icon: <Wrench />,         isPremium: false, isMonthly: true },
  { id: 'coaching',       name: 'Coaching de ventas',                 category: 'Consultoría',  price: 300,  icon: <Users />,          isPremium: false },
  { id: 'marca-sistema',  name: 'Marca & Sistema',                    category: 'Programa',     price: 1900, icon: <Rocket />,         isPremium: true },
  { id: 'plan-starter',   name: 'Plan Starter',                       category: 'Suscripción',  price: 576,  icon: <Package />,        isPremium: false, isMonthly: true },
  { id: 'plan-pro',       name: 'Plan Pro',                           category: 'Suscripción',  price: 1155, icon: <Package />,        isPremium: false, isMonthly: true, highlight: true },
  { id: 'plan-elite',     name: 'Plan Elite',                         category: 'Suscripción',  price: 1733, icon: <Package />,        isPremium: false, isMonthly: true },
];
