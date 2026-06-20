import { useEffect, useState } from 'react';
import './Confetti.css';

/**
 * Confetti — A celebratory particle animation.
 * Creates 60 small colored particles that fall from the top.
 * Auto-cleans up after 3 seconds.
 *
 * @param {Object} props
 * @param {boolean} props.show - Whether to show confetti
 */
export default function Confetti({ show }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!show) {
      setTimeout(() => setParticles([]), 0);
      return;
    }

    const colors = ['#10b981', '#34d399', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      drift: -30 + Math.random() * 60,
    }));
    setTimeout(() => setParticles(newParticles), 0);

    const timer = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timer);
  }, [show]);

  if (particles.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
