// Chen Zhiruo A0256855N
import http from 'k6/http';
import exec from 'k6/execution';
import { Trend, Rate } from 'k6/metrics';
import { check } from 'k6';

const BASE_URL = 'http://localhost:6060';
const PRODUCT_SLUG = 'expensive-laptop';

const LEVELS = [2800, 2900, 2950, 2980, 3000];
const HOLD_SECONDS = 150;
const RECOVERY_SECONDS = 45;
const RECOVERY_VUS = 50;

const SCENARIO_NAMES = [...LEVELS.map((v) => `vus_${String(v).padStart(3, '0')}`), 'recovery'];

const productResponseMetrics = {};
const productFailRates = {};

for (const name of SCENARIO_NAMES) {
  productResponseMetrics[name] = new Trend(`get_product_response_time_${name}`);
  productFailRates[name] = new Rate(`get_product_failed_${name}`);
}

export const options = {
  scenarios: buildSequentialScenarios(),
  summaryTrendStats: ['med', 'p(95)', 'p(99)'],
};

function buildSequentialScenarios() {
  const scenarios = {};
  let offset = 0;

  for (const vus of LEVELS) {
    const name = `vus_${String(vus).padStart(3, '0')}`;
    scenarios[name] = {
      executor: 'constant-vus',
      exec: 'productStress',
      vus: vus,
      duration: `${HOLD_SECONDS}s`,
      gracefulStop: '60s',
      startTime: `${offset}s`,
    };
    offset += HOLD_SECONDS;
  }

  scenarios.recovery = {
    executor: 'constant-vus',
    exec: 'productStress',
    vus: RECOVERY_VUS,
    duration: `${RECOVERY_SECONDS}s`,
    gracefulStop: '5s',
    startTime: `${offset}s`,
  };

  return scenarios;
}

export function productStress() {
  const currentScenario = exec.scenario.name;

  const res = http.get(`${BASE_URL}/api/v1/product/get-product/${PRODUCT_SLUG}`);

  productResponseMetrics[currentScenario].add(res.timings.duration);
}