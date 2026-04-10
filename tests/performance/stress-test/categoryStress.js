// Chen Zhiruo A0256855N
import http from 'k6/http';
import exec from 'k6/execution';
import { Trend, Rate } from 'k6/metrics';
import { check } from 'k6';

const BASE_URL = 'http://localhost:6060';
const LEVELS = [4600, 5000, 5200, 5300, 5400];
const HOLD_SECONDS = 180;
const RECOVERY_SECONDS = 45;
const RECOVERY_VUS = 100;

const SCENARIO_NAMES = [...LEVELS.map((v) => `vus_${String(v).padStart(3, '0')}`), 'recovery'];

const categoryResponseMetrics = {};
const categoryFailRates = {};

for (const name of SCENARIO_NAMES) {
  categoryResponseMetrics[name] = new Trend(`category_response_time_${name}`);
  categoryFailRates[name] = new Rate(`category_failed_${name}`);
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
      exec: 'categoryStress',
      vus: vus,
      duration: `${HOLD_SECONDS}s`,
      gracefulStop: '20s',
      startTime: `${offset}s`,
    };
    offset += HOLD_SECONDS;
  }

  scenarios.recovery = {
    executor: 'constant-vus',
    exec: 'categoryStress',
    vus: RECOVERY_VUS,
    duration: `${RECOVERY_SECONDS}s`,
    gracefulStop: '5s',
    startTime: `${offset}s`,
  };

  return scenarios;
}

export function categoryStress() {
  const currentScenario = exec.scenario.name;

  const res = http.get(`${BASE_URL}/api/v1/category/get-category`);

  categoryResponseMetrics[currentScenario].add(res.timings.duration);

  const ok = check(res, {
    'category status is 200': (r) => r.status === 200,
  });

  categoryFailRates[currentScenario].add(!ok);
}