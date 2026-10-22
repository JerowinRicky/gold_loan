import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Coins, CreditCard, CalendarCheck, User } from 'lucide-react';

export const CustomerBottomNav: React.FC = () => {
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Loans', path: '/loans', icon: Coins },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Appointment', path: '/appointments', icon: CalendarCheck },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9] border-t border-[#DDD5C8] md:hidden px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all text-2xs ${
                  isActive
                    ? 'bg-[#3D2314] text-white font-bold shadow-sm scale-105 ring-1 ring-[#3D2314]'
                    : 'text-charcoal-secondary hover:text-charcoal hover:bg-[#F7ECE8]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-white stroke-[2.5]' : 'text-charcoal-secondary'}`} />
                  <span className={`leading-none ${isActive ? 'text-white font-bold' : ''}`}>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

