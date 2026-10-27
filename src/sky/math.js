/* Small math helpers for spherical sky coordinates and animation. */

export const D2R = Math.PI / 180;

/* seeded random numbers (mulberry32), so hand-drawn wobbles look the same every frame */
export function rng(seed){
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* a point on the sky from right ascension (hours) and declination (degrees) */
export const sph = (raH, decD, mag) => { const ra = raH * 15 * D2R, dec = decD * D2R; return { ra, sd: Math.sin(dec), cd: Math.cos(dec), mag }; };
export const vec = o => [o.cd * Math.cos(o.ra), o.cd * Math.sin(o.ra), o.sd];
export const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function slerp(a, b, t){
  const ang = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  if (ang < 1e-6) return b;
  const s = Math.sin(ang), k1 = Math.sin((1 - t) * ang) / s, k2 = Math.sin(t * ang) / s;
  return norm([a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]);
}

export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const lerp = (p, q, k) => p + (q - p) * k;
export const geo = (p, q, k) => Math.exp(Math.log(p) + (Math.log(q) - Math.log(p)) * k);
