import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  /** 경고(amber) | 에러(red) | 기본(slate) */
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
      icon: 'bg-amber-500/20 text-amber-400',
      border: 'border-amber-500/30',
      button: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    },
    error: {
      icon: 'bg-red-500/20 text-red-400',
      border: 'border-red-500/30',
      button: 'bg-red-500 text-white hover:bg-red-400',
    },
    default: {
      icon: 'bg-slate-500/20 text-slate-400',
      border: 'border-slate-600',
      button: 'bg-slate-600 text-slate-100 hover:bg-slate-500',
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
              className={`relative w-full max-w-sm rounded-2xl border bg-slate-900/95 p-6 shadow-xl shadow-black/40 backdrop-blur ${styles.border}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.icon}`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="alert-title" className="text-lg font-semibold text-slate-100">
                    알림
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">{message}</p>
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
