import { useEffect, useState, useCallback } from 'react';
import './Toast.css';

/**
 * Accent color mapping by toast type.
 */
const TYPE_DEFAULTS = {
  success: { color: 'var(--accent-green, #10b981)', defaultIcon: '✅' },
  warning: { color: 'var(--accent-orange, #f59e0b)', defaultIcon: '⚠️' },
  info: { color: 'var(--accent-blue, #3b82f6)', defaultIcon: 'ℹ️' },
  achievement: { color: 'var(--accent-purple, #8b5cf6)', defaultIcon: '🏆' },
};

/**
 * Toast — Notification toast component.
 * Slides in from the top, auto-dismisses after 3 seconds.
 * Achievement type renders with sparkle confetti background.
 *
 * @param {Object} props
 * @param {string} props.message - The notification message text
 * @param {'success'|'warning'|'info'|'achievement'} [props.type='info'] - Toast style variant
 * @param {string} [props.icon] - Optional override icon (emoji)
 * @param {Function} [props.onDismiss] - Callback when toast is dismissed
 */
export default function Toast({ message, type = 'info', icon, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const typeConfig = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.info;
  const displayIcon = icon || typeConfig.defaultIcon;

  /** Dismiss the toast with exit animation. */
  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  }, [onDismiss]);

  /** Auto-show on mount and auto-dismiss after 3 seconds. */
  useEffect(() => {
    // Trigger enter animation
    const showTimer = requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 3 seconds
    const dismissTimer = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [dismiss]);

  const [sparkles] = useState(() => {
    if (type !== 'achievement') return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 1.5}s`,
      animationDuration: `${1 + Math.random() * 1.5}s`,
    }));
  });

  if (!isVisible && isExiting) return null;

  return (
    <div
      className={`toast toast--${type} ${isVisible && !isExiting ? 'toast--visible' : ''} ${isExiting ? 'toast--exit' : ''}`}
      role="alert"
      aria-live="polite"
      style={{ '--toast-accent': typeConfig.color }}
    >
      {type === 'achievement' && (
        <div className="toast__confetti-bg" aria-hidden="true">
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="toast__sparkle"
              style={{
                left: s.left,
                top: s.top,
                animationDelay: s.animationDelay,
                animationDuration: s.animationDuration,
              }}
            />
          ))}
        </div>
      )}

      <span className="toast__icon" aria-hidden="true">{displayIcon}</span>
      <span className="toast__message">{message}</span>

      <button
        id="toast-dismiss-btn"
        className="toast__close"
        onClick={dismiss}
        aria-label="Dismiss notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
