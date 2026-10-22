import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

export const CustomerNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/my');
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#DDD5C8]">
        <div>
          <h1 className="text-base font-extrabold text-charcoal tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-2xs text-charcoal-secondary">
            Payment due alerts, verified receipts, and appointment updates
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="btn-secondary text-2xs py-1 px-2"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark All Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="card-compact">
        {loading ? (
          <div className="text-center py-6 text-charcoal-secondary text-xs">
            <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-coffee" />
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-[#DDD5C8]/60">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`py-3 px-2 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  !n.isRead ? 'bg-[#fff4f1] font-medium' : 'hover:bg-black/2'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-charcoal">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-ferrari flex-shrink-0" />
                    )}
                    <span className="badge badge-pending text-2xs">
                      {n.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-2xs text-charcoal-secondary leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-2xs font-mono text-charcoal-muted block">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-charcoal-secondary text-2xs">
            You have no notifications in your inbox.
          </div>
        )}
      </div>
    </div>
  );
};

