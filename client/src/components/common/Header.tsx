import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Shield, User, Menu } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title, unreadCount = 0 }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#fff4f1] border-b border-[#DDD5C8] px-4 py-2.5 flex items-center justify-between shadow-subtle">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-1.5 text-charcoal hover:bg-[#EADCC8] rounded md:hidden focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5 text-charcoal" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-ferrari flex items-center justify-center text-white font-bold text-xs shadow-sm">
              ₹
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-xs tracking-tight text-charcoal uppercase block">
                Sri Lakshmi
              </span>
              <span className="text-2xs font-semibold text-ferrari block tracking-wide">
                GOLD FINANCE
              </span>
            </div>
          </Link>

          {title && isAdmin && (
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-[#DDD5C8]">
              <span className="text-xs font-semibold text-charcoal-secondary">{title}</span>
            </div>
          )}

          {/* Customer Desktop Full Navigation Tabs */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-1.5 ml-5 pl-5 border-l border-[#DDD5C8]">
              {[
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'My Loans', path: '/loans' },
                { name: 'Payments', path: '/payments' },
                { name: 'Book Appointment', path: '/appointments' },
                { name: 'Profile', path: '/profile' },
              ].map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#3D2314] text-white shadow-md ring-1 ring-[#3D2314]'
                        : 'text-charcoal hover:bg-[#EADCC8] hover:text-[#3D2314]'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon */}
        <Link
          to={isAdmin ? '/admin/notifications' : '/notifications'}
          className="relative p-1.5 text-charcoal hover:bg-[#EADCC8] rounded transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-charcoal" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-ferrari rounded-full ring-2 ring-[#fff4f1]" />
          )}
        </Link>

        {/* User Info & Role Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#DDD5C8]">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-charcoal leading-none">{user?.name}</div>
            <div className="text-2xs text-charcoal-secondary mt-0.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-0.5 text-ferrari font-semibold">
                  <Shield className="w-2.5 h-2.5" /> Staff Admin
                </span>
              ) : (
                <span>{user?.customerId || user?.phone}</span>
              )}
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-[#EADCC8] border border-[#DDD5C8] flex items-center justify-center text-charcoal font-semibold text-2xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-charcoal-secondary hover:text-ferrari hover:bg-[#EADCC8] rounded transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

