import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Save, CheckCircle2, Shield, Store, Clock, Coins, CreditCard, QrCode, Banknote } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data?.success) {
        setSettings(res.data.data);
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const res = await api.put('/settings', {
        shopName: settings.shopName,
        shopAddress: settings.shopAddress,
        shopPhone: settings.shopPhone,
        shopEmail: settings.shopEmail,
        defaultInterestRate: Number(settings.defaultInterestRate),
        defaultDurationMonths: Number(settings.defaultDurationMonths),
        processingFeePercent: Number(settings.processingFeePercent),
        slotDurationMinutes: Number(settings.slotDurationMinutes),
        workingDays: settings.workingDays,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        upiEnabled: Boolean(settings.upiEnabled),
        upiId: settings.upiId,
        upiPhone: settings.upiPhone,
        upiName: settings.upiName,
        cashCollectionEnabled: Boolean(settings.cashCollectionEnabled),
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="text-center py-10 text-charcoal-secondary text-xs">
        Loading business settings...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-[#DDD5C8]">
        <h1 className="text-base font-extrabold text-charcoal tracking-tight">
          Shop Business Configuration & Policies
        </h1>
        <p className="text-2xs text-charcoal-secondary">
          Configure shop contact details printed on official receipts, interest defaults, and operating hours
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-300 flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          Settings updated successfully! Changes reflect on all newly issued receipts.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business Profile */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-ferrari" />
            1. Shop Identity & Official Receipt Letterhead
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Business Legal Name
              </label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="input-field font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Shop Address (Printed on Receipts)
              </label>
              <input
                type="text"
                required
                value={settings.shopAddress}
                onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Official Business Phone
              </label>
              <input
                type="text"
                required
                value={settings.shopPhone}
                onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Business Contact Email
              </label>
              <input
                type="email"
                required
                value={settings.shopEmail}
                onChange={(e) => setSettings({ ...settings, shopEmail: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Loan Financial Defaults */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-700" />
            2. Standard Loan Terms & Default Interest
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Default Monthly Interest (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={settings.defaultInterestRate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultInterestRate: e.target.value })
                }
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Default Loan Duration (Months)
              </label>
              <input
                type="number"
                required
                value={settings.defaultDurationMonths}
                onChange={(e) =>
                  setSettings({ ...settings, defaultDurationMonths: e.target.value })
                }
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Processing Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={settings.processingFeePercent}
                onChange={(e) =>
                  setSettings({ ...settings, processingFeePercent: e.target.value })
                }
                className="input-field font-mono"
              />
            </div>
          </div>
        </div>

        {/* Working Hours & Appointment Slots */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            3. Working Days & Offline Booking Hours
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Slot Duration (Minutes)
              </label>
              <select
                value={settings.slotDurationMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, slotDurationMinutes: e.target.value })
                }
                className="select-field"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Daily Opening Time
              </label>
              <input
                type="text"
                value={settings.openingTime}
                onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Daily Closing Time
              </label>
              <input
                type="text"
                value={settings.closingTime}
                onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-2xs font-semibold text-charcoal block mb-1">
                Working Days
              </label>
              <input
                type="text"
                value={settings.workingDays}
                onChange={(e) => setSettings({ ...settings, workingDays: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Customer Payment Options Configuration */}
        <div className="card-compact space-y-3">
          <h2 className="text-xs font-bold text-charcoal uppercase tracking-wider pb-1 border-b border-[#DDD5C8] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-coffee" />
            4. Customer Payment Options (UPI & Doorstep Cash)
          </h2>

          <div className="space-y-4 pt-1">
            {/* Option 1: UPI */}
            <div className="p-3 bg-[#FFFDF9] border border-[#DDD5C8] rounded space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C8]/60">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-coffee" />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">1. Direct UPI Payment with Screenshot Verification</span>
                    <span className="text-2xs text-charcoal-secondary block">
                      Customer pays to store UPI ID/Phone and uploads payment screenshot for admin verification.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.upiEnabled)}
                    onChange={(e) => setSettings({ ...settings, upiEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-coffee"></div>
                </label>
              </div>

              {settings.upiEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-1">
                      Store UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. srilakshmi@upi"
                      value={settings.upiId || ''}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                      className="input-field font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-1">
                      UPI Payee Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sri Lakshmi Gold Finance"
                      value={settings.upiName || ''}
                      onChange={(e) => setSettings({ ...settings, upiName: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-charcoal block mb-1">
                      Registered UPI Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9845012345"
                      value={settings.upiPhone || ''}
                      onChange={(e) => setSettings({ ...settings, upiPhone: e.target.value })}
                      className="input-field font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: Doorstep Cash Collection */}
            <div className="p-3 bg-[#FFFDF9] border border-[#DDD5C8] rounded space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C8]/60">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="text-xs font-bold text-charcoal block">2. Doorstep Cash Collection</span>
                    <span className="text-2xs text-charcoal-secondary block">
                      Customer picks an appointment time slot; executive visits customer's registered profile address to collect cash.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.cashCollectionEnabled)}
                    onChange={(e) => setSettings({ ...settings, cashCollectionEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-coffee"></div>
                </label>
              </div>

              <p className="text-2xs text-charcoal-muted">
                Address is automatically fetched from the customer's verified profile. Time slots correspond to store availability slots.
              </p>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving Configurations...' : 'Save Business Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

