import { test } from "node:test";
import assert from "node:assert/strict";
import { entryLink, parseLink, entryText, dayReport } from "../src/game/share.js";

const BASE = "https://draw-sky.web.app/";

test("an entry link opens the same entry", () => {
  const url = entryLink(BASE, "ori", "2026-10-27", "uid_A-1");
  assert.ok(url.startsWith(BASE + "?"));
  assert.deepEqual(parseLink(new URL(url).search), { cid: "ori", day: "2026-10-27", author: "uid_A-1" });
  /* an address that already carries a query or a hash loses them */
  assert.deepEqual(parseLink(new URL(entryLink(BASE + "?old=1#x", "r3", "2026-10-28", "b")).search), { cid: "r3", day: "2026-10-28", author: "b" });
});

test("anything else is not an entry link", () => {
  for (const s of ["", "?c=ori", "?c=nope&d=2026-10-27&e=a", "?c=ori&d=27-10-2026&e=a", "?c=ori&d=2026-10-27&e=a/b", "?c=__proto__&d=2026-10-27&e=a"])
    assert.equal(parseLink(s), null, s);
});

test("share words ask for a star only while votes are open", () => {
  const e = { c: "ori", d: "2026-10-27", name: "모래시계" };
  assert.match(entryText(e, "", true, true), /^제가 다시 그린 오리온자리: 「모래시계」\n.*별 하나 주세요/);
  assert.match(entryText(e, "민지", false, true), /^민지님이 다시 그린 오리온자리/);
  assert.doesNotMatch(entryText(e, "민지", false, false), /별 하나 주세요/);
});

test("the day report lists my entries best first", () => {
  const mine = [{ c: "uma", name: "국자", rank: 4, votes: 1 }, { c: "ori", name: "모래시계", rank: 1, votes: 7 }];
  const open = dayReport("2026-10-27", mine, true, 3).split("\n");
  assert.equal(open[0], "다시 그린 하늘 · 10월 27일");
  assert.equal(open[1], "🌟 오리온자리 「모래시계」 1위 · 별 7개");
  assert.equal(open[2], "✦ 큰곰자리 「국자」 4위 · 별 1개");
  assert.match(open[3], /마감까지 3시간/);
  const done = dayReport("2026-10-26", mine, false).split("\n");
  assert.equal(done[0], "다시 그린 하늘 · 10월 26일 결과");
  assert.equal(done[1], "🥇 오리온자리 「모래시계」 1위 · 별 7개");
  assert.equal(dayReport("2026-10-26", [], false), "");
});
