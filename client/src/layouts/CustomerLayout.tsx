import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { CustomerBottomNav } from '../components/common/CustomerBottomNav';

export const CustomerLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4f1] flex items-center justify-center text-xs text-charcoal">
        Loading customer session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fff4f1] text-charcoal flex flex-col font-sans pb-16 md:pb-6">
      <Header title="Customer App" />

      <main className="flex-1 p-3 sm:p-5 md:px-8 overflow-y-auto w-full">
        <div className="w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile-first customer bottom bar */}
      <CustomerBottomNav />
    </div>
  );
};

