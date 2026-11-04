import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: process.env.NEUROGLOVE_TEST_URL || 'http://127.0.0.1:5002', channel: 'msedge', headless: true, viewport: { width: 1440, height: 900 } },
  workers: 1,
});
