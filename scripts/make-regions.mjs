/* Cuts the "이름 없는 하늘" play areas out of the real star data (public/sky.json) and writes src/data/regions.js.
   Each area keeps the brightest stars within its radius, skips stars that already belong to a named
   constellation in the game, and drops stars crowded too close to a brighter one (too hard to tap).
   Run: node scripts/make-regions.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { NAMED } from "../src/data/constellations.js";

/* [이름 끝 번호, 근처 길잡이, 중심 적경(h), 중심 적위(°), 반지름(°)] */
const AREAS = [
  [1, "알데바란 곁", 4.6, 19, 12],
  [2, "카펠라 곁", 5.6, 40, 11],
  [3, "미르팍 곁", 3.4, 45, 11],
  [4, "안드로메다 은하 곁", 1.0, 36, 11],
  [5, "가을의 큰 사각형", 23.2, 20, 12],
  [6, "알타이르 곁", 19.8, 8, 11],
  [7, "베가 서쪽", 17.2, 30, 12],
  [8, "아르크투루스 곁", 14.6, 26, 12],
  [9, "스피카 곁", 13.0, -4, 13],
  [10, "시리우스 곁", 7.0, -22, 12]
];
const MAG_LIMIT = 5.2, MAX_STARS = 22, CROWD = 0.9;
const D2R = Math.PI / 180;
const sep = (ra1, d1, ra2, d2) => {   // degrees between two points (ra in degrees)
  const c = Math.sin(d1 * D2R) * Math.sin(d2 * D2R) + Math.cos(d1 * D2R) * Math.cos(d2 * D2R) * Math.cos((ra1 - ra2) * D2R);
  return Math.acos(Math.max(-1, Math.min(1, c))) / D2R;
};

const f = JSON.parse(readFileSync("public/sky.json", "utf8")).stars, all = [];
for (let i = 0; i + 3 < f.length; i += 4) if (f[i + 2] / 100 <= MAG_LIMIT) all.push({ ra: f[i] / 100, dec: f[i + 1] / 100, mag: f[i + 2] / 100 });
all.sort((a, b) => a.mag - b.mag);
const named = NAMED.flatMap(c => c.stars.map(s => ({ ra: s[2] * 15, dec: s[3] })));

const regions = AREAS.map(([n, near, raH, dec, r]) => {
  const picked = [];
  for (const s of all){
    if (sep(s.ra, s.dec, raH * 15, dec) > r) continue;
    if (named.some(t => sep(s.ra, s.dec, t.ra, t.dec) < 0.3)) continue;
    if (picked.some(t => sep(s.ra, s.dec, t.ra, t.dec) < CROWD)) continue;
    picked.push(s); if (picked.length === MAX_STARS) break;
  }
  const stars = picked.map((s, i) => [String(i + 1), "", +(s.ra / 15).toFixed(3), +s.dec.toFixed(3), +s.mag.toFixed(2)]);
  return { id: `r${n}`, ko: `이름 없는 하늘 ${n}`, la: near, ab: `R${n}`, region: true,
    myth: "옛사람들이 이 별들로 따로 그린 그림은 없어요. 이 하늘의 첫 이름을 지어 주세요.", stars, lines: "" };
});

const body = `/* "이름 없는 하늘": play areas cut from the real star catalogue by scripts/make-regions.mjs. Do not edit by hand.
   Same shape as constellations.js; stars are [번호, "", 적경(h), 적위(°), 등급]. */
export const REGIONS = ${JSON.stringify(regions, null, 0).replace(/\},\{"id"/g, '},\n{"id"')};
`;
writeFileSync("src/data/regions.js", body);
console.log(regions.map(r => `${r.id} ${r.la}: ${r.stars.length} stars`).join("\n"));
