import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

process.env.JWT_SECRET = "test_secret_for_ci_pipeline_12345";
process.env.BRAINTREE_MERCHANT_ID = "dummy_id";
process.env.BRAINTREE_PUBLIC_KEY = "dummy_key";
process.env.BRAINTREE_PRIVATE_KEY = "dummy_private";

process.env.SUPPRESS_JEST_WARNINGS = 'true';

export default async () => {
  console.log("🛠️  CI Environment Variables Initialized");
};