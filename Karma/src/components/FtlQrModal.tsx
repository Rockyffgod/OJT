import { X, QrCode, ImageOff } from 'lucide-react';
import { useTrans } from '../i18n';
import FtlQrCode from './FtlQrCode';
import type { FtlAlert } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  alert: FtlAlert;
}

export default function FtlQrModal({ open, onClose, alert }: Props) {
  const { t } = useTrans();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
              {t('ftl.qrTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 flex items-center justify-center sm:w-[280px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
            <FtlQrCode uuid={alert.id} imageUrl={alert.image_url} />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 flex items-center justify-center">
              {alert.image_url ? (
                <img src={alert.image_url} alt={alert.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageOff size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('ftl.noImage')}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {t('ftl.titleLabel')}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {alert.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {t('ftl.description')}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                {alert.description}
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {t('ftl.qrHint')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
