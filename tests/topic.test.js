import { test } from "node:test";
import assert from "node:assert/strict";
import { topicOf } from "../src/game/topic.js";
import { ORDER } from "../src/data/constellations.js";
import { THEMES } from "../src/data/topics.js";
import { DAY, dayOf } from "../src/game/time.js";

const days = (start, n) => Array.from({ length: n }, (_, i) => dayOf(Date.UTC(2026, 9, 27, 3) + (start + i) * DAY));

test("the same day always gives the same topic", () => {
  assert.deepEqual(topicOf("2026-10-27"), topicOf("2026-10-27"));
  const t = topicOf("2026-10-27");
  assert.ok(ORDER.includes(t.cid));
  assert.ok(t.theme && t.example);
});

test("every constellation comes round within 8 days, never twice in a row", () => {
  const cids = days(0, 8).map(d => topicOf(d).cid);
  assert.equal(new Set(cids).size, ORDER.length);
  for (let i = 1; i < 40; i++) assert.notEqual(topicOf(days(i, 1)[0]).cid, topicOf(days(i - 1, 1)[0]).cid);
});

test("no theme repeats until the whole list has been used", () => {
  const themes = days(-5, THEMES.length).map(d => topicOf(d).theme);
  assert.equal(new Set(themes).size, THEMES.length);
});
