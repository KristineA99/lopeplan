// Skriver ut en eksempelplan i terminalen. Kjør med: npm run demo
import { generatePlan } from './generatePlan';

const plan = generatePlan({
  distanceKm: 10,
  goalDate: '2027-02-28',
  level: 'litt_trent',
  goalTimeMin: 55,
  startDate: '2026-10-26',
});

console.log('Realistisk:', plan.feasibility.realistic, plan.feasibility.message ?? '');
let week = 0;
for (const s of plan.sessions) {
  if (s.week !== week) {
    week = s.week;
    console.log(`\nUke ${week}`);
  }
  const amount = s.distanceKm ? `${s.distanceKm} km` : `${s.durationMin} min`;
  console.log(`  ${s.date}  ${s.title.padEnd(16)} ${amount.padEnd(8)} ${s.pace ? s.pace + ' /km  ' : ''}${s.main}`);
}
