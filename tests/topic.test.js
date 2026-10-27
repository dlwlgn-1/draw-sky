import { test } from "node:test";
import assert from "node:assert/strict";
import { topicOf, baseTopic, nextEvent } from "../src/game/topic.js";
import { EVENTS } from "../src/data/events.js";
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

test("days before the unnamed skies joined keep their topics", () => {
  assert.equal(topicOf("2026-10-27").cid, "uma");
  assert.equal(topicOf("2026-10-27").theme, "아침 풍경");
});

test("from 2026-10-28 every sky comes round, named or not, never twice in a row", () => {
  const cids = days(1, ORDER.length).map(d => baseTopic(d).cid);   // 2026-10-28 onward, before special nights
  assert.equal(days(1, 1)[0], "2026-10-28");
  assert.equal(new Set(cids).size, ORDER.length);
  const two = days(0, 3 * 366);   // three years, special nights included
  for (let i = 1; i < two.length; i++) assert.notEqual(topicOf(two[i]).cid, topicOf(two[i - 1]).cid, two[i]);
});

test("special nights take their date every year, from 2026-10-28 on", () => {
  for (const year of [2026, 2027, 2030]){
    const t = topicOf(`${year}-11-17`);
    assert.equal(t.cid, "leo"); assert.equal(t.event.title, "사자자리 유성우"); assert.equal(t.theme, EVENTS["11-17"].theme);
  }
  assert.equal(topicOf("2026-10-29").event, null);
  assert.equal(topicOf("2026-08-12").event, null);   // before special nights began: unchanged
  for (const ev of Object.values(EVENTS)) assert.ok(ORDER.includes(ev.cid) && ev.title && ev.theme && ev.example && ev.note);
});

test("the next special night within a week", () => {
  assert.deepEqual([nextEvent("2026-11-14").day, nextEvent("2026-11-14").inDays], ["2026-11-17", 3]);
  assert.equal(nextEvent("2026-11-17"), null);   // today's does not count, and the next is weeks away
  assert.equal(nextEvent("2026-12-31").day, "2027-01-01");
});

test("no theme repeats until the whole list has been used", () => {
  const themes = days(-5, THEMES.length).map(d => baseTopic(d).theme);
  assert.equal(new Set(themes).size, THEMES.length);
});
