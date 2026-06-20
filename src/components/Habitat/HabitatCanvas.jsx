/**
 * HabitatCanvas — The star feature of CarbonTwin.
 * Renders an animated island ecosystem on HTML5 Canvas
 * that reacts in real-time to the user's carbon score.
 * Features time of day simulation, wind speed effects, and upgrading Eco-Home.
 */

import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import './HabitatCanvas.css';

/** Color palettes */
const COLORS = {
  ocean: { clean: '#0ea5e9', murky: '#4a6741' },
  island: { base: '#2d5016', light: '#4ade80', dark: '#166534' },
  tree: { trunk: '#5c3a1e', canopy: ['#22c55e', '#16a34a', '#15803d', '#4ade80'] },
  flower: ['#f472b6', '#fb923c', '#facc15', '#a78bfa', '#f87171', '#34d399'],
  smog: 'rgba(120, 120, 120, 0.15)',
};

/** Sky color keyframes for linear interpolation */
const SKY_KEYS = [
  { h: 0, colors: ['#020617', '#090d16', '#111827', '#020617'] }, // Midnight
  { h: 5, colors: ['#090d16', '#1e1b4b', '#311042', '#7c2d12'] }, // Dawn starts
  { h: 6.5, colors: ['#1e1b4b', '#831843', '#e11d48', '#fda4af'] }, // Sunrise
  { h: 9, colors: ['#0369a1', '#0284c7', '#38bdf8', '#bae6fd'] }, // Morning
  { h: 12, colors: ['#0284c7', '#0ea5e9', '#38bdf8', '#e0f2fe'] }, // Noon
  { h: 16, colors: ['#0369a1', '#0284c7', '#38bdf8', '#bae6fd'] }, // Afternoon
  { h: 18, colors: ['#1e1b4b', '#7c2d12', '#ea580c', '#fef08a'] }, // Sunset
  { h: 19.5, colors: ['#311042', '#4c1d95', '#1e1b4b', '#090d16'] }, // Twilight
  { h: 22, colors: ['#020617', '#090d16', '#111827', '#020617'] }, // Late Night
  { h: 24, colors: ['#020617', '#090d16', '#111827', '#020617'] }, // Midnight wrap
];

/** Linear interpolate between two hex colors */
function lerpHexColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  
  const ar = (ah >> 16) & 0xff;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;
  
  const br = (bh >> 16) & 0xff;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;
  
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}

/** Get interpolated sky colors for a given hour */
function getSkyColors(hour) {
  let nextIdx = SKY_KEYS.findIndex(k => k.h >= hour);
  if (nextIdx === -1) nextIdx = SKY_KEYS.length - 1;
  const prevIdx = Math.max(0, nextIdx - 1);

  const prev = SKY_KEYS[prevIdx];
  const next = SKY_KEYS[nextIdx];

  let t = 0;
  if (next.h !== prev.h) {
    t = (hour - prev.h) / (next.h - prev.h);
  }

  return [
    lerpHexColor(prev.colors[0], next.colors[0], t),
    lerpHexColor(prev.colors[1], next.colors[1], t),
    lerpHexColor(prev.colors[2], next.colors[2], t),
    lerpHexColor(prev.colors[3], next.colors[3], t),
  ];
}

/** Simple seeded PRNG for deterministic positioning */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HabitatCanvas = forwardRef(function HabitatCanvas({ 
  habitatState, 
  onReady,
  manualTime = null,
  windSpeed = 3,
  showEcoHome = true
}, ref) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const particlesRef = useRef([]);
  const containerRef = useRef(null);
  
  // Cache layout size to avoid layout thrashing
  const widthRef = useRef(500);
  const heightRef = useRef(312);

  const state = habitatState || {
    healthScore: 50, trees: 5, flowers: 3, birds: 1,
    smogLevel: 0.2, waterClarity: 0.8, hasRainbow: false, particles: [],
  };

  /** Expose triggerEffect and exportToPNG to parent via ref */
  useImperativeHandle(ref, () => ({
    triggerEffect(type) {
      const cx = widthRef.current / 2;
      const cy = heightRef.current * 0.55;
      const count = type === 'rainbow' ? 30 : 20;

      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 160,
          y: cy + (Math.random() - 0.5) * 80,
          vx: (Math.random() - 0.5) * 3,
          vy: type === 'smoke' ? -Math.random() * 2 - 1 : -Math.random() * 3 - 1,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          size: type === 'smoke' ? 6 + Math.random() * 8 : 3 + Math.random() * 4,
          color: type === 'smoke'
            ? `rgba(120,120,120,${0.4 + Math.random() * 0.3})`
            : type === 'bloom'
              ? COLORS.flower[Math.floor(Math.random() * COLORS.flower.length)]
              : type === 'rainbow'
                ? `hsl(${Math.random() * 360}, 80%, 65%)`
                : `hsl(${120 + Math.random() * 40}, 80%, ${60 + Math.random() * 20}%)`,
          type,
        });
      }
    },
    exportToPNG() {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    }
  }));

  /** Draw the full scene */
  const draw = useCallback((ctx, w, h, t) => {
    // Determine the simulated hour
    const hour = manualTime !== null ? manualTime : new Date().getHours();
    const isNight = hour < 6 || hour >= 20;
    const rng = seededRandom(42);

    ctx.clearRect(0, 0, w, h);

    // ── Sky gradient (interpolated) ───────────────────
    const skyColors = getSkyColors(hour);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    skyGrad.addColorStop(0, skyColors[0]);
    skyGrad.addColorStop(0.35, skyColors[1]);
    skyGrad.addColorStop(0.7, skyColors[2]);
    skyGrad.addColorStop(1, skyColors[3]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.65);

    // ── Stars (opacity based on time) ─────────────────
    let starOpacity = 0;
    if (hour < 5 || hour >= 20) {
      starOpacity = 1;
    } else if (hour >= 5 && hour < 6.5) {
      starOpacity = 1 - (hour - 5) / 1.5;
    } else if (hour >= 18.5 && hour < 20) {
      starOpacity = (hour - 18.5) / 1.5;
    }

    if (starOpacity > 0.05) {
      ctx.save();
      ctx.globalAlpha = starOpacity;
      for (let i = 0; i < 40; i++) {
        const sx = rng() * w;
        const sy = rng() * h * 0.5;
        const ss = 0.5 + rng() * 1.5;
        const twinkle = 0.3 + Math.abs(Math.sin(t * 0.002 + i)) * 0.7;
        ctx.globalAlpha = starOpacity * twinkle;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx, sy, ss, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Celestial Body (Sun/Moon moving in an arc) ───
    const isDaylight = hour >= 6 && hour < 18.5;
    let celestialX;
    let celestialY;
    
    if (isDaylight) {
      // Sun trajectory arc
      const sunAngle = ((hour - 6) / 12.5) * Math.PI;
      celestialX = w * 0.5 - Math.cos(sunAngle) * (w * 0.38);
      celestialY = h * 0.62 - Math.sin(sunAngle) * (h * 0.45);

      // Sun glow
      const sunGrad = ctx.createRadialGradient(celestialX, celestialY, 0, celestialX, celestialY, 50);
      sunGrad.addColorStop(0, 'rgba(253, 186, 116, 0.9)'); // golden sun
      sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.3)');
      sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Moon trajectory arc
      const moonHour = hour < 6 ? hour + 24 : hour;
      const moonAngle = ((moonHour - 18.5) / 11.5) * Math.PI;
      celestialX = w * 0.5 - Math.cos(moonAngle) * (w * 0.38);
      celestialY = h * 0.62 - Math.sin(moonAngle) * (h * 0.45);

      // Moon glow
      const moonGrad = ctx.createRadialGradient(celestialX, celestialY, 0, celestialX, celestialY, 30);
      moonGrad.addColorStop(0, 'rgba(226, 232, 240, 0.4)');
      moonGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 30, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 14, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon shadow/crescent cutout
      ctx.fillStyle = skyColors[1];
      ctx.beginPath();
      ctx.arc(celestialX + 5, celestialY - 3, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Rainbow (bonus streak) ────────────────────────
    if (state.hasRainbow) {
      const rcx = w * 0.5;
      const rcy = h * 0.58;
      const rainbowColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
      rainbowColors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.22 + Math.sin(t * 0.002 + i) * 0.08;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(rcx, rcy, 120 + i * 5, Math.PI, 0);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // ── Clouds (speed driven by windSpeed) ───────────
    for (let i = 0; i < 4; i++) {
      const cx = ((rng() * w + t * (0.08 + i * 0.04) * (windSpeed / 3)) % (w + 140)) - 70;
      const cy = 25 + rng() * h * 0.22;
      ctx.globalAlpha = 0.12 + rng() * 0.12;
      ctx.fillStyle = isNight ? '#334155' : '#f8fafc';
      drawCloud(ctx, cx, cy, 28 + rng() * 25);
    }
    ctx.globalAlpha = 1;

    // ── Ocean ──────────────────────────────────────────
    const oceanY = h * 0.62;
    const clarity = state.waterClarity;
    const oceanColor = lerpColor(COLORS.ocean.murky, COLORS.ocean.clean, clarity);
    const oceanGrad = ctx.createLinearGradient(0, oceanY, 0, h);
    oceanGrad.addColorStop(0, oceanColor);
    oceanGrad.addColorStop(1, darkenColor(oceanColor, 0.45));
    ctx.fillStyle = oceanGrad;

    // Animated wave path with windSpeed scaling frequency and height
    ctx.beginPath();
    ctx.moveTo(0, oceanY);
    const waveHeight = 4 + (windSpeed / 3.5) * 3;
    const waveFreq = 0.015 + (windSpeed * 0.001);
    for (let x = 0; x <= w; x += 4) {
      const wave1 = Math.sin((x * waveFreq) + t * 0.0022) * waveHeight;
      const wave2 = Math.sin((x * waveFreq * 0.5) + t * 0.0015) * (waveHeight * 0.6);
      ctx.lineTo(x, oceanY + wave1 + wave2);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Wave highlights
    ctx.strokeStyle = `rgba(255,255,255,${0.07 + clarity * 0.08})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const wave = Math.sin((x * waveFreq) + t * 0.0022) * waveHeight;
      if (x === 0) ctx.moveTo(x, oceanY + wave);
      else ctx.lineTo(x, oceanY + wave);
    }
    ctx.stroke();

    // ── Island ─────────────────────────────────────────
    const ix = w * 0.5;
    const iy = h * 0.60;
    const iw = w * 0.55;
    const ih = h * 0.18;

    // Island shape
    const islandGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, iw * 0.5);
    islandGrad.addColorStop(0, COLORS.island.light);
    islandGrad.addColorStop(0.5, COLORS.island.base);
    islandGrad.addColorStop(1, COLORS.island.dark);
    ctx.fillStyle = islandGrad;
    ctx.beginPath();
    ctx.ellipse(ix, iy, iw * 0.5, ih * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sandy edge
    ctx.fillStyle = 'rgba(194, 165, 108, 0.25)';
    ctx.beginPath();
    ctx.ellipse(ix, iy + ih * 0.16, iw * 0.47, ih * 0.23, 0, 0, Math.PI);
    ctx.fill();

    // ── Trees (sway scales with windSpeed) ────────────
    const treeRng = seededRandom(123);
    const treeCount = Math.min(state.trees, 15);
    for (let i = 0; i < treeCount; i++) {
      const tx = ix + (treeRng() - 0.5) * iw * 0.7;
      const ty = iy - ih * 0.08 + (treeRng() - 0.5) * ih * 0.3;
      
      // Prevent drawing tree directly on top of the house coordinates
      const hx = ix + iw * 0.12;
      const hy = iy + ih * 0.05;
      const dist = Math.hypot(tx - hx, ty - hy);
      
      if (showEcoHome && dist < 32) continue; // Skip trees overlapping the home

      const treeSize = 0.55 + treeRng() * 0.45;
      const sway = Math.sin(t * 0.001 * (windSpeed / 3 + 0.5) + i * 1.5) * (1.8 * (windSpeed / 3));
      drawTree(ctx, tx, ty, treeSize, sway, treeRng);
    }

    // ── Eco-Home Upgrade Rendering ────────────────────
    if (showEcoHome) {
      const hx = ix + iw * 0.12;
      const hy = iy + ih * 0.05;
      drawEcoHome(ctx, hx, hy, 0.9, state.healthScore, t, windSpeed);
    }

    // ── Flowers ────────────────────────────────────────
    const flowerRng = seededRandom(456);
    const flowerCount = Math.min(state.flowers, 20);
    for (let i = 0; i < flowerCount; i++) {
      const fx = ix + (flowerRng() - 0.5) * iw * 0.55;
      const fy = iy + (flowerRng() - 0.2) * ih * 0.28;
      
      // Don't draw flowers under the house if active
      if (showEcoHome) {
        const hx = ix + iw * 0.12;
        const hy = iy + ih * 0.05;
        if (Math.hypot(fx - hx, fy - hy) < 20) continue;
      }

      const fc = COLORS.flower[i % COLORS.flower.length];
      const bloom = Math.min(1, 0.5 + Math.sin(t * 0.0025 + i) * 0.35);
      ctx.fillStyle = fc;
      ctx.globalAlpha = 0.7 + bloom * 0.3;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.8 + bloom * 2.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Tiny green stem
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(fx, fy + 2);
      ctx.lineTo(fx, fy + 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Birds / Butterflies ────────────────────────────
    for (let i = 0; i < Math.min(state.birds, 5); i++) {
      const bx = w * 0.18 + (i * w * 0.16) + Math.sin(t * 0.0018 + i * 2) * 35;
      const by = h * 0.12 + Math.cos(t * 0.0012 + i * 3) * 22 + i * 12;
      drawBird(ctx, bx, by, t, i);
    }

    // ── Smog overlay ───────────────────────────────────
    if (state.smogLevel > 0.05) {
      ctx.fillStyle = `rgba(100, 100, 100, ${state.smogLevel * 0.22})`;
      ctx.fillRect(0, 0, w, h);

      // Smoke clouds drifting
      for (let i = 0; i < Math.floor(state.smogLevel * 10); i++) {
        const sx = ix + (seededRandom(i * 77)() - 0.5) * iw * 0.4;
        const sy = iy - 32 - Math.abs(Math.sin(t * 0.0008 + i * 2)) * 55;
        ctx.fillStyle = `rgba(140, 140, 140, ${0.04 + state.smogLevel * 0.07})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 7 + Math.sin(t * 0.0018 + i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Triggered particles ────────────────────────────
    const activeParticles = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.type === 'smoke') p.vy *= 0.97;
      else p.vy += 0.015; // gravity for sparkles

      if (p.life > 0) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        activeParticles.push(p);
      }
    }
    ctx.globalAlpha = 1;
    particlesRef.current = activeParticles;

  }, [state, manualTime, windSpeed, showEcoHome]);

  /** Animation loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let running = true;

    // Use ResizeObserver for robust layout responsiveness
    const resize = (entries) => {
      let rect;
      if (entries && entries[0]) {
        rect = entries[0].contentRect;
      } else {
        rect = container.getBoundingClientRect();
      }
      
      // Guard: Do not resize to 0 when parent container is hidden (display: none)
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      widthRef.current = rect.width;
      heightRef.current = rect.height;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      resize(entries);
    });
    resizeObserver.observe(container);

    // Initial resize trigger
    resize();

    let isVisible = !document.hidden;

    const loop = () => {
      if (!running) return;
      
      if (isVisible && widthRef.current > 0 && heightRef.current > 0) {
        timeRef.current += 16;
        draw(ctx, widthRef.current, heightRef.current, timeRef.current);
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    const handleVisibilityChange = () => {
      const wasVisible = isVisible;
      isVisible = !document.hidden;
      // Resume the loop if it just became visible and is supposed to be running
      if (isVisible && !wasVisible && running) {
        loop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isVisible) {
      loop();
    }
    if (onReady) onReady();

    return () => {
      running = false;
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw, onReady]);

  return (
    <div
      ref={containerRef}
      className="habitat-canvas-container"
      role="img"
      aria-label={`Your island habitat with health score ${state.healthScore}%, ${state.trees} trees, ${state.flowers} flowers, air quality: ${state.smogLevel > 0.7 ? 'smoggy' : state.smogLevel > 0.3 ? 'hazy' : 'clear'}, and water clarity: ${state.waterClarity > 0.7 ? 'crystal clear' : state.waterClarity > 0.3 ? 'cloudy' : 'murky'}`}
    >
      <canvas ref={canvasRef} className="habitat-canvas" />
      <div
        className="habitat-glow-ring"
        style={{
          boxShadow: state.healthScore > 70
            ? '0 0 30px rgba(16, 185, 129, 0.3), inset 0 0 30px rgba(16, 185, 129, 0.05)'
            : state.healthScore > 40
              ? '0 0 20px rgba(245, 158, 11, 0.2)'
              : '0 0 20px rgba(239, 68, 68, 0.2)',
        }}
      />
    </div>
  );
});

/** Draw a stylized cloud */
function drawCloud(ctx, x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
  ctx.arc(x + size * 0.7, y, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x - size * 0.3, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw a tree with canopy and trunk */
function drawTree(ctx, x, y, scale, sway, rng) {
  const trunkH = 17 * scale;
  const canopyR = 11 * scale;

  // Trunk
  ctx.fillStyle = COLORS.tree.trunk;
  ctx.fillRect(x - 2 * scale, y - trunkH, 4 * scale, trunkH);

  // Canopy (3 overlapping circles with wind sway)
  const color = COLORS.tree.canopy[Math.floor(rng() * COLORS.tree.canopy.length)];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + sway * 0.5, y - trunkH - canopyR * 0.3, canopyR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - canopyR * 0.35 + sway * 0.3, y - trunkH + canopyR * 0.2, canopyR * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + canopyR * 0.35 + sway * 0.6, y - trunkH + canopyR * 0.2, canopyR * 0.72, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw a small flying bird */
function drawBird(ctx, x, y, t, i) {
  const wingSpan = 7;
  const wingAngle = Math.sin(t * 0.0075 + i * 2) * 0.48;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - wingSpan, y + wingAngle * wingSpan);
  ctx.quadraticCurveTo(x - wingSpan * 0.3, y - wingAngle * 2.5, x, y);
  ctx.quadraticCurveTo(x + wingSpan * 0.3, y - wingAngle * 2.5, x + wingSpan, y + wingAngle * wingSpan);
  ctx.stroke();
}

/** Draw a windmill tower and spinning blades */
function drawWindmill(ctx, x, y, size, t, windSpeed) {
  ctx.save();
  ctx.translate(x, y);

  // Tower (sleek tapered grey triangle/line)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(-1.5, 0);
  ctx.lineTo(-0.7, -size);
  ctx.lineTo(0.7, -size);
  ctx.lineTo(1.5, 0);
  ctx.closePath();
  ctx.fill();

  // Rotor center hub
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, -size, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw 3 blades rotating based on time & wind speed
  const rotorSpeed = windSpeed > 0 ? (t * 0.0008 * (windSpeed + 1)) : 0;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < 3; i++) {
    const angle = rotorSpeed + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(
      Math.cos(angle) * (size * 0.65),
      -size + Math.sin(angle) * (size * 0.65)
    );
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw upgrading eco-home depending on healthScore */
function drawEcoHome(ctx, x, y, scale, healthScore, t, windSpeed) {
  ctx.save();
  ctx.translate(x, y);

  if (healthScore < 35) {
    // 🏠 Tier 1: Polluted Shack / Tin cabin (Low health)
    // Cabin body
    ctx.fillStyle = '#475569';
    ctx.fillRect(-12 * scale, -13 * scale, 24 * scale, 13 * scale);
    
    // Rust streaks
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-7 * scale, -13 * scale);
    ctx.lineTo(-7 * scale, 0);
    ctx.moveTo(4 * scale, -13 * scale);
    ctx.lineTo(4 * scale, 0);
    ctx.stroke();

    // Asymmetric rusted roof
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(-15 * scale, -13 * scale);
    ctx.lineTo(2 * scale, -20 * scale);
    ctx.lineTo(15 * scale, -11 * scale);
    ctx.closePath();
    ctx.fill();

    // Dark dingy door
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3 * scale, -7 * scale, 6 * scale, 7 * scale);

    // Chimney puffing heavy dark smoke
    ctx.fillStyle = '#334155';
    ctx.fillRect(7 * scale, -18 * scale, 3 * scale, 8 * scale);
    
    const smokeOffset = (t * 0.035) % 15;
    ctx.fillStyle = 'rgba(75, 85, 99, 0.45)';
    ctx.beginPath();
    ctx.arc(8.5 * scale + Math.sin(t * 0.012) * 2.5, -20 * scale - smokeOffset, 3.5 + smokeOffset * 0.35, 0, Math.PI * 2);
    ctx.fill();

  } else if (healthScore < 75) {
    // 🏡 Tier 2: Cozy Cabin (Medium health)
    // Wood cabin logs
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-15 * scale, -15 * scale, 30 * scale, 15 * scale);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 0.8;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-15 * scale, -15 * scale + (i * 3.7) * scale);
      ctx.lineTo(15 * scale, -15 * scale + (i * 3.7) * scale);
      ctx.stroke();
    }

    // Classic red triangular roof
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(-18 * scale, -15 * scale);
    ctx.lineTo(0, -25 * scale);
    ctx.lineTo(18 * scale, -15 * scale);
    ctx.closePath();
    ctx.fill();

    // Dark wood door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4 * scale, -9 * scale, 8 * scale, 9 * scale);

    // Glowing warm window
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(6 * scale, -11 * scale, 5 * scale, 5 * scale);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(6 * scale, -11 * scale, 5 * scale, 5 * scale);

    // Chimney puffing light friendly vapor
    ctx.fillStyle = '#57534e';
    ctx.fillRect(-12 * scale, -21 * scale, 4 * scale, 10 * scale);
    
    const smokeOffset = (t * 0.022) % 12;
    ctx.fillStyle = 'rgba(241, 245, 249, 0.28)';
    ctx.beginPath();
    ctx.arc(-10 * scale + Math.sin(t * 0.007) * 2, -23 * scale - smokeOffset, 2.5 + smokeOffset * 0.28, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // 🍃 Tier 3: Modern Eco-Cottage (High health)
    // Main clean white body
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -9 * scale, 18 * scale, 9 * scale, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-18 * scale, -9 * scale, 36 * scale, 9 * scale);

    // Solar panels on roof
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-13 * scale, -15 * scale, 10 * scale, 5 * scale);
    ctx.fillRect(3 * scale, -15 * scale, 10 * scale, 5 * scale);
    
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-13 * scale, -15 * scale, 10 * scale, 5 * scale);
    ctx.strokeRect(3 * scale, -15 * scale, 10 * scale, 5 * scale);

    // Sleek glass window (cyan)
    ctx.fillStyle = 'rgba(34, 211, 238, 0.38)';
    ctx.beginPath();
    ctx.arc(7 * scale, -7 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Modern glass door
    ctx.fillStyle = 'rgba(13, 148, 136, 0.75)';
    ctx.fillRect(-4 * scale, -10 * scale, 8 * scale, 10 * scale);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(-4 * scale, -10 * scale, 8 * scale, 10 * scale);

    // Spinning Eco-Windmill next to the dome
    drawWindmill(ctx, -24 * scale, 0, 26 * scale, t, windSpeed);
  }

  ctx.restore();
}

/** Linear interpolate between hex/rgb values */
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

/** Darken a color string */
function darkenColor(colorStr, amount) {
  const match = colorStr.match(/\d+/g);
  if (!match) return colorStr;
  const [r, g, b] = match.map(Number);
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`;
}

export default HabitatCanvas;
