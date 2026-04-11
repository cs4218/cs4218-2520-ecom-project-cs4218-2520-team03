// Chen Zhiruo A0256855N
import http from 'k6/http';
import exec from 'k6/execution';
import { Trend, Rate } from 'k6/metrics';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3000';
const USER_EMAIL = 'user@gmail.com';
const USER_PASSWORD = '123456';

const LEVELS = [800, 1000, 1300, 1350, 1380, 1390, 1395];
const HOLD_SECONDS = 120;
const RECOVERY_SECONDS = 60;
const RECOVERY_VUS = 50;
const GRACEFUL_STOP = '45s';
const STAGE_GAP_SECONDS = 20;

const SCENARIO_NAMES = [
  ...LEVELS.map((v) => `vus_${String(v).padStart(3, '0')}`),
  'recovery',
];

const loginMetrics = {};
const loginFailRates = {};

for (const name of SCENARIO_NAMES) {
  loginMetrics[name] = new Trend(`login_response_time_${name}`);
  loginFailRates[name] = new Rate(`login_failed_${name}`);
}

const scenarios = {};
let offset = 0;

for (const vus of LEVELS) {
  const name = `vus_${String(vus).padStart(3, '0')}`;
  scenarios[name] = {
    executor: 'constant-vus',
    exec: 'loginStress',
    vus,
    duration: `${HOLD_SECONDS}s`,
    gracefulStop: GRACEFUL_STOP,
    startTime: `${offset}s`,
  };
  offset += HOLD_SECONDS + STAGE_GAP_SECONDS;
}

scenarios.recovery = {
  executor: 'constant-vus',
  exec: 'loginStress',
  vus: RECOVERY_VUS,
  duration: `${RECOVERY_SECONDS}s`,
  gracefulStop: GRACEFUL_STOP,
  startTime: `${offset}s`,
};

export const options = {
  scenarios,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)'],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<5000'],
  },
};

export function loginStress() {
  const scenarioName = exec.scenario.name;

  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '45s',
    }
  );

  let token = null;
  try {
    const data = res.json();
    token = data && data.token ? data.token : null;
  } catch (e) {
    token = null;
  }

  const ok = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': () => !!token,
  });

  loginMetrics[scenarioName].add(res.timings.duration);
  loginFailRates[scenarioName].add(!ok);
}