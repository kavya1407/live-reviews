import React, { useEffect, useState } from 'react';

export default function Toastr({ toast, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!toast) return;
    setTimeLeft(5);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <aside className="toastr-container" aria-live="polite" role="status">
      <div className="toastr-card">
        <div className="toastr-icon" aria-hidden="true">✓</div>
        <div className="toastr-body">
          <p className="toastr-message">{toast.message}</p>
          <span className="toastr-countdown">Auto-dismissing in {timeLeft}s</span>
        </div>
        <div className="toastr-actions">
          {toast.onUndo && (
            <button
              type="button"
              className="btn btn-undo"
              onClick={() => {
                toast.onUndo();
                onDismiss();
              }}
            >
              Undo
            </button>
          )}
          <button
            type="button"
            className="btn btn-toastr-close"
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
