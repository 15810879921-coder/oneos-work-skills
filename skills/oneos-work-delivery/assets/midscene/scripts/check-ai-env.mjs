import 'dotenv/config';
const required = ['ONEOS_TEST_URL', 'ONEOS_TEST_EXPECTED_TEXT'];
const missing = required.filter(k => !process.env[k]);
if (missing.length || process.env.ONEOS_TEST_ENV_KIND !== 'test') {
  console.error('Configure TEST environment, URL and explicit expected content. Missing keys:', missing.join(', '));
  process.exit(2);
}
const url = new URL(process.env.ONEOS_TEST_URL);
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
  console.error('Use an HTTP(S) test URL without credentials.'); process.exit(2);
}
console.log('TEST target configured. Model credentials are resolved by Midscene; values are not printed.');
