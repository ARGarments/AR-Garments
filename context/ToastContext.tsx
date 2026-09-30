'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, options?: { title?: string; duration?: number }) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, options?: { title?: string; duration?: number }) => string;
    error: (message: string, options?: { title?: string; duration?: number }) => string;
    info: (message: string, options?: { title?: string; duration?: number }) => string;
    warning: (message: string, options?: { title?: string; duration?: number }) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: { title?: string; duration?: number }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration ?? 4000;

      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration,
      };

      setToasts((prev) => {
        // Keep maximum of 5 toasts at a time
        const next = [...prev, newToast];
        if (next.length > 5) {
          return next.slice(next.length - 5);
        }
        return next;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (msg: string, opts?: { title?: string; duration?: number }) => showToast(msg, 'success', opts),
      error: (msg: string, opts?: { title?: string; duration?: number }) => showToast(msg, 'error', opts),
      info: (msg: string, opts?: { title?: string; duration?: number }) => showToast(msg, 'info', opts),
      warning: (msg: string, opts?: { title?: string; duration?: number }) => showToast(msg, 'warning', opts),
    }),
    [showToast]
  );

  const toastPortal = mounted && typeof document !== 'undefined' ? (
    createPortal(
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes toastSlideInRight {
            from {
              opacity: 0;
              transform: translateX(100%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          .toast-card-animate {
            animation: toastSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
        <div
          id="global-toast-container"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none',
            maxWidth: '420px',
            width: 'calc(100vw - 32px)',
          }}
        >
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            const borderColor = isSuccess
              ? '#083028'
              : isError
              ? '#DC2626'
              : isWarning
              ? '#D97706'
              : '#083028';

            return (
              <div
                key={t.id}
                role="status"
                className="toast-card-animate"
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  boxShadow: '0 20px 40px -10px rgba(8, 48, 40, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  borderLeft: `5px solid ${borderColor}`,
                  fontFamily: 'inherit',
                }}
              >
                {/* Icon */}
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {isSuccess && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      <CheckCircle2 size={18} strokeWidth={2.2} />
                    </div>
                  )}
                  {isError && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #fecdd3',
                      }}
                    >
                      <AlertCircle size={18} strokeWidth={2.2} />
                    </div>
                  )}
                  {isWarning && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: '#fffbeb',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <AlertTriangle size={18} strokeWidth={2.2} />
                    </div>
                  )}
                  {!isSuccess && !isError && !isWarning && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: '#f4fbf7',
                        color: '#083028',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #d1e7dd',
                      }}
                    >
                      <Info size={18} strokeWidth={2.2} />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
                  {t.title ? (
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        margin: '0 0 2px 0',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t.title}
                    </h4>
                  ) : null}
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: '#374151',
                      margin: 0,
                      lineHeight: '1.45',
                      fontWeight: 500,
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close notification"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </>,
      document.body
    )
  ) : null;

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      {toastPortal}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
