import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Lock, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [email, setEmail] = useState<string>(user?.email || '');
  const [address, setAddress] = useState<string>(user?.profile?.address || '');
  const [city, setCity] = useState<string>(user?.profile?.city || '');
  const [state, setState] = useState<string>(user?.profile?.state || '');
  const [pincode, setPincode] = useState<string>(user?.profile?.pincode || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<boolean>(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setIsSavingProfile(true);
      setProfileSuccess(false);
      const res = await api.patch(`/customers/${user.id}/profile`, {
        email,
        address,
        city,
        state,
        pincode,
      });

      if (res.data?.success) {
        setProfileSuccess(true);
        refreshUser();
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(false);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="pb-1 border-b border-[#DDD5C8]">
        <h1 className="text-base font-extrabold text-charcoal tracking-tight">
          Customer Profile & Security
        </h1>
        <p className="text-2xs text-charcoal-secondary">
          Manage your personal contact info and login credentials
        </p>
      </div>

      {/* KYC Readonly Summary */}
      <div className="card-compact bg-[#FBF8F3] space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
          <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-coffee" /> Verified KYC Identity
          </span>
          <span className="badge badge-active">KYC Verified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs">
          <div>
            <span className="text-charcoal-muted block">Legal Name:</span>
            <span className="font-bold text-charcoal">{user?.name}</span>
          </div>
          <div>
            <span className="text-charcoal-muted block">Customer ID:</span>
            <span className="font-bold font-mono text-coffee">{user?.customerId}</span>
          </div>
          <div>
            <span className="text-charcoal-muted block">Primary Mobile (Locked):</span>
            <span className="font-mono">{user?.phone}</span>
          </div>
          <div>
            <span className="text-charcoal-muted block">Govt ID Type & Number:</span>
            <span className="font-mono">
              {user?.profile?.idType || 'Aadhaar'} ({user?.profile?.idNumber || '••••'})
            </span>
          </div>
        </div>

        <div className="text-2xs text-charcoal-muted pt-1 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-amber-700 flex-shrink-0" />
          Primary legal name, registered mobile, and government identity are controlled by shop compliance staff and cannot be altered online.
        </div>
      </div>

      {/* Responsive 2-column Grid for Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Editable Contact Details */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8]">
            Update Residential & Communication Address
          </h2>

          {profileSuccess && (
            <div className="p-2 bg-emerald-50 text-emerald-800 text-2xs rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Street / Flat Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="btn-primary"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-coffee" /> Change Password
          </h2>

          {passwordError && (
            <div className="p-2 bg-red-50 text-coffee text-2xs rounded border border-red-200">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-2 bg-emerald-50 text-emerald-800 text-2xs rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Password changed successfully!
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-2xs font-semibold text-charcoal block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="btn-secondary text-xs"
              >
                <Lock className="w-3.5 h-3.5 text-coffee" />
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

