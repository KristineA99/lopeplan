// Kjør med: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from './generatePlan';
import { daysBetween } from './dates';
import type { Session } from './types';

const HARD = new Set(['intervall', 'tempo', 'bakke']);
const longRunsPerWeek = (s: Session[]) => {
  const map = new Map<number, number>();
  for (const x of s) if (x.type === 'langtur') map.set(x.week, x.distanceKm!);
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, km]) => km);
};

test('nybegynner 5 km på 10 uker er realistisk og ender med måldag', () => {
  const plan = generatePlan({ distanceKm: 5, goalDate: '2027-01-03', level: 'nybegynner', startDate: '2026-10-26' });
  assert.equal(plan.feasibility.realistic, true);
  assert.equal(plan.sessionsPerWeek, 3);
  const last = plan.sessions.at(-1)!;
  assert.equal(last.type, 'konkurranse');
  assert.equal(last.date, '2027-01-03');
  assert.equal(plan.sessions[0].type, 'gaa_jogg');
});

test('ingen økter før start eller etter måldato', () => {
  const plan = generatePlan({ distanceKm: 10, goalDate: '2027-03-17', level: 'litt_trent', startDate: '2026-10-22' });
  for (const s of plan.sessions) {
    assert.ok(daysBetween('2026-10-22', s.date) >= 0, s.date);
    assert.ok(daysBetween(s.date, '2027-03-17') >= 0, s.date);
  }
});

test('harde økter ligger aldri to dager på rad', () => {
  for (const n of [2, 3, 4, 5, 6]) {
    const plan = generatePlan({
      distanceKm: 21.1, goalDate: '2027-05-02', level: 'godt_trent', sessionsPerWeek: n, startDate: '2026-10-26',
    });
    const hard = plan.sessions.filter((s) => HARD.has(s.type));
    for (let i = 1; i < hard.length; i++) {
      assert.ok(daysBetween(hard[i - 1].date, hard[i].date) >= 2, `${n} økter: ${hard[i - 1].date} og ${hard[i].date}`);
    }
  }
});

test('langturen øker maks ca. 10 % (eller 0,5 km) per uke, og hver 4. uke er lettere', () => {
  const plan = generatePlan({ distanceKm: 21.1, goalDate: '2027-04-25', level: 'litt_trent', startDate: '2026-10-26' });
  const longs = longRunsPerWeek(plan.sessions);
  // Sammenlign med forrige vanlige uke (etter en lett uke går man tilbake til kurven)
  let prev = longs[0];
  for (let i = 1; i < longs.length; i++) {
    if ((i + 1) % 4 === 0) continue;
    const allowed = Math.max(prev * 1.1, prev + 0.5) + 0.5; // +0,5 for avrunding
    assert.ok(longs[i] <= allowed, `uke ${i + 1}: ${prev} → ${longs[i]}`);
    prev = longs[i];
  }
  assert.ok(longs[3] < longs[2], 'uke 4 skal være lettere enn uke 3');
  assert.ok(Math.max(...longs) >= 17.5, 'bør nå ca. 18 km langtur før halvmaraton');
});

test('for kort tid gir advarsel med ny dato og kortere distanse', () => {
  const plan = generatePlan({ distanceKm: 21.1, goalDate: '2027-01-03', level: 'nybegynner', startDate: '2026-10-26' });
  assert.equal(plan.feasibility.realistic, false);
  assert.ok(plan.feasibility.suggestedDate);
  assert.equal(plan.feasibility.suggestedDistanceKm, 5);
  assert.match(plan.feasibility.message!, /kort tid/);
});

test('maraton for nybegynner anbefales ikke', () => {
  const plan = generatePlan({ distanceKm: 42.2, goalDate: '2027-09-01', level: 'nybegynner', startDate: '2026-10-26' });
  assert.equal(plan.feasibility.realistic, false);
  assert.equal(plan.feasibility.suggestedDistanceKm, 21.1);
});

test('med måltid får øktene tempo, uten måltid bare anstrengelse', () => {
  const med = generatePlan({ distanceKm: 10, goalDate: '2027-01-31', level: 'litt_trent', goalTimeMin: 55, startDate: '2026-10-26' });
  const rolig = med.sessions.find((s) => s.type === 'rolig')!;
  assert.equal(rolig.pace, '6:45'); // 5:30 + 1:15
  assert.equal(med.sessions.at(-1)!.pace, '5:30');

  const uten = generatePlan({ distanceKm: 10, goalDate: '2027-01-31', level: 'litt_trent', startDate: '2026-10-26' });
  assert.ok(uten.sessions.every((s) => s.pace === undefined && s.effort.length > 0));
});

test('ugyldig dato gir feilmelding', () => {
  assert.throws(() => generatePlan({ distanceKm: 5, goalDate: '2026-10-01', level: 'litt_trent', startDate: '2026-10-26' }));
});
