import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to Database first
    if (env.NODE_ENV !== 'test') {
      await connectDatabase();
    }

    // 2. Instantiate Express App
    const app = createApp();
    const server = http.createServer(app);

    // 3. Listen on PORT
    server.listen(env.PORT, () => {
      console.log('\x1b[36m%s\x1b[0m', `🚀 [server] EarlyJobs ATS Server listening on port ${env.PORT}`);
      console.log(`   Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`   Environment:  ${env.NODE_ENV}`);
    });

    // 4. Graceful Shutdown Handlers (Render sends SIGTERM on deployment)
    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 [server] Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('[server] HTTP server closed.');
        try {
          await disconnectDatabase();
          console.log('[server] Graceful shutdown complete.');
          process.exit(0);
        } catch (err: any) {
          console.error('[server] Error during DB disconnect:', err.message);
          process.exit(1);
        }
      });

      // Force exit if cleanup hangs > 10s
      setTimeout(() => {
        console.error('[server] Forced exit due to shutdown timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error: any) {
    console.error('\x1b[31m%s\x1b[0m', `💥 [server] Startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
