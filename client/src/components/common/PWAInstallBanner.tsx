import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed it recently
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="bg-[#FFFDF9] border border-[#DDD5C8] border-l-4 border-l-ferrari p-2.5 rounded shadow-card mb-3 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-[#fff4f1] flex items-center justify-center text-ferrari flex-shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-charcoal block">Install Sri Lakshmi App</span>
          <span className="text-2xs text-charcoal-secondary">
            Quick access from your desktop or home screen with offline capability
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={handleInstallClick} className="btn-primary text-2xs py-1 px-2.5">
          <Download className="w-3 h-3" />
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-charcoal-secondary hover:text-charcoal rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

