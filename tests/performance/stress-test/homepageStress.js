// Chen Zhiruo A0256855N
import http from 'k6/http';
import exec from 'k6/execution';
import { Trend, Rate } from 'k6/metrics';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3000';
const LEVELS = [200, 600, 1000, 1200, 1400, 1600, 1800, 2000, 2200];
const HOLD_SECONDS = 60;
const RECOVERY_SECONDS = 20;
const RECOVERY_VUS = 50;

const SCENARIO_NAMES = [...LEVELS.map((v) => `vus_${String(v).padStart(3, '0')}`), 'recovery'];

const homepageResponseMetrics = {};
const homepageFailRates = {};

for (const name of SCENARIO_NAMES) {
  homepageResponseMetrics[name] = new Trend(`homepage_response_time_${name}`);
  homepageFailRates[name] = new Rate(`homepage_failed_${name}`);
}

export const options = {
  scenarios: buildSequentialScenarios(),
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)'],
};

function buildSequentialScenarios() {
  const scenarios = {};
  let offset = 0;

  for (const vus of LEVELS) {
    const name = `vus_${String(vus).padStart(3, '0')}`;
    scenarios[name] = {
      executor: 'constant-vus',
      exec: 'homepageStress',
      vus: vus,
      duration: `${HOLD_SECONDS}s`,
      gracefulStop: '5s',
      startTime: `${offset}s`,
    };
    offset += HOLD_SECONDS;
  }

  scenarios.recovery = {
    executor: 'constant-vus',
    exec: 'homepageStress',
    vus: RECOVERY_VUS,
    duration: `${RECOVERY_SECONDS}s`,
    gracefulStop: '5s',
    startTime: `${offset}s`,
  };

  return scenarios;
}

export function homepageStress() {
  const currentScenario = exec.scenario.name;

  const res = http.get(`${BASE_URL}/`);

  homepageResponseMetrics[currentScenario].add(res.timings.duration);

  const ok = check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage has html content': (r) =>
      String(r.headers['Content-Type'] || '').includes('text/html'),
  });

  homepageFailRates[currentScenario].add(!ok);
}