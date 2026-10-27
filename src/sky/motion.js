/* Moving the camera between constellations, and the glow-in after it lands. */
import { S } from "../game/state.js";
import { vec, dot, slerp, ease, lerp, geo } from "./math.js";
import { fit } from "./projection.js";
import { draw } from "./render.js";
import { reduceMotion } from "../ui/dom.js";

let anim = null, rq = 0, rqFast = false;
export const isMoving = () => !!anim;

/* one draw per frame at most; fast (faint stars left out) only if every request this frame asked for it */
export function requestDraw(fast = false){
  if (anim) return;
  rqFast = rq ? rqFast && fast : fast;
  if (rq) return;
  rq = requestAnimationFrame(() => { rq = 0; draw(rqFast); });
}

/* the chosen constellation's lines and glow fade in over a second */
export function startReveal(){
  S.reveal = performance.now();
  const loop = () => { if (anim) return; const rv = draw(); if (rv < 1) requestAnimationFrame(loop); else S.reveal = 0; };
  requestAnimationFrame(loop);
}

/* The sky pulls back a little and glides along the great circle to the next constellation.
   quick: a short reframe of the same constellation. With the effect off, it switches at once. */
export function flyTo(cid, quick){
  const to = fit(cid), first = !S.cam;
  if (first || reduceMotion || (!quick && !S.spin)){ S.cam = to; anim = null; if (first || quick) requestDraw(); else startReveal(); return; }
  const from = { ...S.cam };
  const va = vec({ ra: from.ra, sd: Math.sin(from.dec), cd: Math.cos(from.dec) }), vb = vec({ ra: to.ra, sd: Math.sin(to.dec), cd: Math.cos(to.dec) });
  const ang = Math.acos(Math.max(-1, Math.min(1, dot(va, vb))));
  const running = !!anim;
  anim = { from, to, va, vb, t0: performance.now(), dur: quick ? 420 : 700 + 800 * Math.min(1, ang / 1.6), bump: quick ? 0 : Math.min(.6, ang * .45), quick: !!quick };
  if (!running) requestAnimationFrame(step);
}

function step(now){
  const a = anim; if (!a) return;
  const t = Math.min(1, (now - a.t0) / a.dur), e = ease(t), v = slerp(a.va, a.vb, e), f = a.from, o = a.to;
  S.cam = {
    ra: Math.atan2(v[1], v[0]), dec: Math.asin(v[2]),
    s: geo(f.s, o.s, e) * (1 - a.bump * Math.sin(Math.PI * t)),
    ox: lerp(f.ox, o.ox, e), oy: lerp(f.oy, o.oy, e), cy: lerp(f.cy, o.cy, e)
  };
  draw(t < 1);
  if (t < 1) requestAnimationFrame(step);
  else { anim = null; S.cam = { ...o }; if (a.quick) draw(); else startReveal(); }
}
