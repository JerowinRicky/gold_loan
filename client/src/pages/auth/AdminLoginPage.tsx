import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState<string>('admin@example.com');
  const [password, setPassword] = useState<string>('Admin@12345');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/admin/login', {
        identifier,
        password,
      });

      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setIdentifier('admin@example.com');
    setPassword('Admin@12345');
  };

  return (
    <div className="min-h-screen bg-[#fff4f1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex w-12 h-12 rounded bg-ferrari items-center justify-center text-white font-extrabold text-xl shadow-md mb-2">
            ₹
          </div>
          <h1 className="text-xl font-extrabold text-charcoal tracking-tight">
            Sri Lakshmi Gold Finance
          </h1>
          <div className="inline-flex items-center gap-1 text-2xs font-bold text-ferrari uppercase tracking-widest bg-[#EADCC8] px-2.5 py-0.5 rounded">
            <Shield className="w-3 h-3" /> Staff & Owner Administration Portal
          </div>
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
                Admin Email / Username
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-charcoal-subtle" />
                <input
                  type="text"
                  required
                  placeholder="admin@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input-field pl-8"
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
              {loading ? 'Authenticating Admin...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Seed Quick-Fill for immediate testing */}
          <div className="pt-3 border-t border-[#DDD5C8] text-center">
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-2xs text-charcoal-secondary hover:text-ferrari underline font-mono block mx-auto"
            >
              ⚡ Quick-fill Seed Credentials: admin@example.com / Admin@12345
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-2xs text-charcoal-secondary hover:text-ferrari font-medium"
            >
              Customer Login Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

