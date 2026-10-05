import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, ExternalLink, X, Globe, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-izny3gcpk5tywrxjttfxhu-634096981357.us-west2.run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0D121B] border border-slate-700/80 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white font-display">
              Установка на телефон и постоянный доступ
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Permanent Live Access */}
        <div className="bg-[#080C14] border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Постоянный URL приложения (Google Cloud)
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800/40">
              Онлайн 24/7
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Чтобы ссылка стала доступна публично с любого телефона без авторизации в Google, нажмите кнопку 
            <strong className="text-amber-400"> «Share» (Поделиться)</strong> вверху справа в интерфейсе Google AI Studio. 
            После этого ссылка активируется в облаке Google Cloud:
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#0D121B] border border-slate-700 text-slate-300 select-all"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Direct PWA Install on Android / iOS */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-400" />
            Способ 1: Установка как приложение на телефон (PWA без Google Play)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Приложение настроено как <strong>Progressive Web App (PWA)</strong>. Оно устанавливается
            на смартфон точно так же, как обычное нативное приложение: появляется иконка на рабочем
            столе, отдельное полноэкранное окно без адресной строки браузера и быстрый запуск.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#080C14] border border-slate-800/80 p-3 space-y-1.5">
              <div className="font-semibold text-slate-200">📱 Android (Chrome / Brave / Edge)</div>
              <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px] leading-relaxed">
                <li>Откройте ссылку в браузере Chrome на телефоне.</li>
                <li>Нажмите кнопку меню <strong>(три точки ⋮)</strong> вверху справа.</li>
                <li>Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</li>
              </ol>
              {isInstallable && (
                <button
                  type="button"
                  onClick={() => {
                    install();
                    onClose();
                  }}
                  className="w-full mt-2 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors"
                >
                  Установить прямо сейчас
                </button>
              )}
            </div>

            <div className="bg-[#080C14] border border-slate-800/80 p-3 space-y-1.5">
              <div className="font-semibold text-slate-200">🍏 iPhone / iPad (Safari)</div>
              <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px] leading-relaxed">
                <li>Откройте ссылку в <strong>Safari</strong>.</li>
                <li>Нажмите кнопку <strong>«Поделиться» (иконка со стрелочкой вверх 📤)</strong> внизу экрана.</li>
                <li>Пролистайте вниз и выберите <strong>«На экран "Домой"»</strong>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 3. Generating a Standalone APK */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Способ 2: Сборка в виде реального установочного файла .APK
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Если вам нужен именно установочный файл <strong>.apk</strong> (для отправки друзьям или установки через проводник):
          </p>
          <div className="bg-[#080C14] border border-slate-800 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-200">Онлайн-генератор PWABuilder (бесплатно, от Microsoft):</span>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
              >
                <span>pwabuilder.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside text-slate-400 text-[11px] space-y-1 leading-relaxed">
              <li>Зайдите на сайт <strong className="text-slate-300">PWABuilder.com</strong>.</li>
              <li>Вставьте URL приложения (<code className="font-mono text-amber-300">{currentUrl}</code>).</li>
              <li>Нажмите <strong>Start</strong> → <strong>Package for Stores</strong> → выберите <strong>Android</strong>.</li>
              <li>Скачайте готовый подписанный <strong>.apk</strong> архив!</li>
            </ol>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer transition-colors"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
