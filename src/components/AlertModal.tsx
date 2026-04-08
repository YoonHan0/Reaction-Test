import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  variant?: 'warning' | 'error' | 'default';
}

export const AlertModal = ({
  isOpen,
  message,
  onClose,
  variant = 'warning',
}: AlertModalProps) => {
  const variantStyles = {
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    error: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    default: {
      icon: 'bg-slate-100 text-slate-600',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="alert-title"
              className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-lg"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.icon}`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="alert-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    알림
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${styles.button}`}
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
