import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Coins,
  CalendarCheck,
  CreditCard,
  Gem,
  Bell,
  BarChart3,
  Settings,
  History,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Gold Loans', path: '/admin/loans', icon: Coins },
    { name: 'Appointments', path: '/admin/appointments', icon: CalendarCheck },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Gold Inventory', path: '/admin/inventory', icon: Gem },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFDF9] border-r border-[#DDD5C8] w-56 text-charcoal select-none">
      {/* Brand Header for Mobile Drawer */}
      <div className="p-3 border-b border-[#DDD5C8] flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-ferrari flex items-center justify-center text-white font-bold text-xs">
            ₹
          </div>
          <span className="font-bold text-xs text-charcoal uppercase tracking-wider">
            ADMIN CONSOLE
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-charcoal-secondary hover:bg-[#EADCC8] rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <div className="px-2 pb-1 text-2xs font-bold text-charcoal-subtle uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-all ${
                  isActive
                    ? 'bg-[#3D2314] text-white font-bold shadow-sm ring-1 ring-[#3D2314]'
                    : 'text-charcoal hover:bg-[#F2ECE2] active:bg-[#EADCC8] font-medium'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info & Logout */}
      <div className="p-2 border-t border-[#DDD5C8] bg-[#F8F4ED]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium text-charcoal hover:text-ferrari hover:bg-[#EADCC8] transition-colors"
        >
          <LogOut className="w-4 h-4 text-charcoal-secondary" />
          <span>Sign Out</span>
        </button>
        <div className="text-center text-2xs text-charcoal-muted mt-2">
          v1.0 • Sri Lakshmi Finance
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Compact Sidebar */}
      <aside className="hidden md:block h-[calc(100vh-45px)] sticky top-[45px] flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

