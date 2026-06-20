/**
 * MicroAction — Daily one-tap suggestion card.
 * Shows a contextual suggestion to reduce carbon footprint.
 */

import { useState } from 'react';
import './MicroAction.css';

/**
 * @param {Object} props
 * @param {Object} props.suggestion - { text, impact, icon, actionType }
 * @param {Function} [props.onAccept] - Called when user accepts
 * @param {Function} [props.onDismiss] - Called when user dismisses
 */
export default function MicroAction({ suggestion, onAccept, onDismiss }) {
  const [state, setState] = useState('idle'); // 'idle' | 'accepted' | 'dismissed'

  if (!suggestion || state === 'dismissed') return null;

  const handleAccept = () => {
    setState('accepted');
    if (onAccept) onAccept(suggestion);
    setTimeout(() => setState('dismissed'), 2000);
  };

  const handleDismiss = () => {
    setState('dismissed');
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`micro-action ${state === 'accepted' ? 'micro-action--accepted' : ''}`} role="complementary" aria-label="Daily suggestion">
      <span className="micro-action__icon" aria-hidden="true">{suggestion.icon}</span>
      <div className="micro-action__content">
        <p className="micro-action__text">{suggestion.text}</p>
        <span className="micro-action__impact">→ {suggestion.impact}</span>
      </div>
      {state === 'idle' && (
        <div className="micro-action__actions">
          <button
            id="micro-action-accept"
            className="micro-action__btn micro-action__btn--accept"
            onClick={handleAccept}
            aria-label="Accept suggestion"
          >
            ✓
          </button>
          <button
            id="micro-action-dismiss"
            className="micro-action__btn micro-action__btn--dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss suggestion"
          >
            ✕
          </button>
        </div>
      )}
      {state === 'accepted' && (
        <span className="micro-action__accepted-badge">🌿 +1</span>
      )}
    </div>
  );
}
