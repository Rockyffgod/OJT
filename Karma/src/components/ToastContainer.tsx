import { useToast, ToastVariant } from '../hooks/useToast';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const variantStyles: Record<
  ToastVariant,
  { bg: string; text: string; icon: JSX.Element }
> = {
  success: {
    bg: 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-800',
    text: 'text-slate-900 dark:text-slate-100',
    icon: <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />,
  },
  error: {
    bg: 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800',
    text: 'text-slate-900 dark:text-slate-100',
    icon: <XCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />,
  },
  info: {
    bg: 'bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-800',
    text: 'text-slate-900 dark:text-slate-100',
    icon: <Info size={18} className="text-violet-600 dark:text-violet-400 flex-shrink-0" />,
  },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const styles = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border ${styles.bg} ${styles.text} shadow-sm`}
            role="alert"
          >
            {styles.icon}
            <p className="text-sm flex-1 min-w-0">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-smooth flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
