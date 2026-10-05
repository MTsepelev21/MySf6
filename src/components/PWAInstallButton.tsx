import React, { useState } from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setIsModalOpen(true);
          }
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer"
        title="Установить на телефон или получить APK"
      >
        {isInstallable ? (
          <>
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Установить</span>
          </>
        ) : (
          <>
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>На телефон / APK</span>
          </>
        )}
      </button>

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
