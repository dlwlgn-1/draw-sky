/* The real sky, loaded from sky.json (d3-celestial data): XHIP/Hipparcos stars to magnitude 8
   with their B−V colour, and Milky Way outlines in five brightness steps. */
import { D2R } from "./math.js";
import { DATA } from "../data/constellations.js";

export const SKY = { ready: false, bright: [], buckets: [], mw: null };

/* until sky.json arrives, only the playable constellations' stars are drawn */
export const FALLBACK = DATA.flatMap(c => c.sv.map(o => ({ ...o, rgb: "247,243,230" })));

const BV_RGB = [[-9, "170,191,255"], [0, "198,212,255"], [.3, "236,240,255"], [.6, "255,246,232"], [1, "255,226,190"], [1.4, "255,204,150"]];
const bvRgb = bv => { let c = BV_RGB[0][1]; for (const [t, rgb] of BV_RGB) if (bv >= t) c = rgb; return c; };
const MAG_BINS = [
  { min: 7.3, max: 8.6, r: .3, a: .2, faint: true },
  { min: 6.6, max: 7.3, r: .34, a: .3, faint: true },
  { min: 5.8, max: 6.6, r: .42, a: .5 },
  { min: 5, max: 5.8, r: .6, a: .66 },
  { min: 4, max: 5, r: .85, a: .8 },
  { min: 3, max: 4, r: 1.2, a: .92 }
];

/* stars brighter than 3rd magnitude are drawn one by one; the rest are binned by brightness and colour */
export function loadSky(data){
  const f = data.stars, buckets = new Map();
  for (let i = 0; i + 3 < f.length; i += 4){
    const ra = f[i] / 100 * D2R, dec = f[i + 1] / 100 * D2R, mag = f[i + 2] / 100, rgb = bvRgb(f[i + 3] / 100);
    const o = { ra, sd: Math.sin(dec), cd: Math.cos(dec), mag, rgb };
    if (mag < 3){ SKY.bright.push(o); continue; }
    const bi = MAG_BINS.findIndex(b => mag >= b.min && mag < b.max); if (bi < 0) continue;
    const key = bi + "|" + rgb;
    if (!buckets.has(key)) buckets.set(key, { list: [], rgb, ...MAG_BINS[bi] });
    buckets.get(key).list.push(o);
  }
  SKY.buckets = [...buckets.values()];
  SKY.mw = data.mw.map(rings => rings.map(r => {
    const pts = [];
    for (let i = 0; i + 1 < r.length; i += 2){ const ra = r[i] / 10 * D2R, dec = r[i + 1] / 10 * D2R; pts.push({ ra, sd: Math.sin(dec), cd: Math.cos(dec) }); }
    return pts;
  }));
  SKY.ready = true;
}
