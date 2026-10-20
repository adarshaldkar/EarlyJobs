import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 300000, // 5 minutes to ensure first-time binary download finishes
    testTimeout: 30000,
    globals: true,
    fileParallelism: false // Sequential run so single binary download is shared
  }
});
