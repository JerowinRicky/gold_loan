import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Coins, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState<string>('9876543210');
  const [password, setPassword] = useState<string>('Gold@3210');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', {
        identifier,
        password,
      });

      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (phone: string, pass: string) => {
    setIdentifier(phone);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-[#fff4f1] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex w-12 h-12 rounded bg-ferrari items-center justify-center text-white font-extrabold text-xl shadow-md mb-2">
            ₹
          </div>
          <h1 className="text-xl font-extrabold text-charcoal tracking-tight">
            Sri Lakshmi Gold Finance
          </h1>
          <p className="text-2xs text-charcoal-secondary uppercase tracking-widest font-semibold">
            Customer Self-Service Loan Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="mt-6 card-compact bg-[#FFFDF9] border border-[#DDD5C8] p-6 shadow-card space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 text-ferrari text-2xs rounded border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Registered Mobile Number or Customer ID
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210 or CUST-1001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input-field pl-8 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-8"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2 font-bold"
            >
              {loading ? 'Logging In...' : 'Access My Gold Loans'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Seed Quick-Select Pill Tabs */}
          <div className="pt-3 border-t border-[#DDD5C8] space-y-1.5">
            <span className="text-2xs font-semibold text-charcoal-muted uppercase tracking-wider block text-center">
              ⚡ Demo Customer Quick-Fill:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-2xs font-mono">
              <button
                type="button"
                onClick={() => handleSelectCustomer('9876543210', 'Gold@3210')}
                className="p-1.5 bg-[#fff4f1] hover:bg-[#F7ECE8] border border-[#DDD5C8] rounded text-left"
              >
                <span className="font-bold block text-charcoal">Rahul Kumar</span>
                <span className="text-charcoal-secondary text-2xs">Active ₹50k Loan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCustomer('9876543211', 'Gold@3211')}
                className="p-1.5 bg-[#fff4f1] hover:bg-[#F7ECE8] border border-[#DDD5C8] rounded text-left"
              >
                <span className="font-bold block text-charcoal">Anjali Sharma</span>
                <span className="text-charcoal-secondary text-2xs">Active ₹85k Loan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCustomer('9876543212', 'Gold@3212')}
                className="p-1.5 bg-[#fff4f1] hover:bg-[#F7ECE8] border border-[#DDD5C8] rounded text-left"
              >
                <span className="font-bold block text-ferrari">Arun Patel</span>
                <span className="text-charcoal-secondary text-2xs">Overdue Loan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCustomer('9876543213', 'Gold@3213')}
                className="p-1.5 bg-[#fff4f1] hover:bg-[#F7ECE8] border border-[#DDD5C8] rounded text-left"
              >
                <span className="font-bold block text-emerald-800">Priya Verma</span>
                <span className="text-charcoal-secondary text-2xs">Gold Released</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-[#DDD5C8]">
            <Link
              to="/admin/login"
              className="text-2xs text-charcoal-secondary hover:text-ferrari font-semibold"
            >
              Shop Owner / Staff Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

