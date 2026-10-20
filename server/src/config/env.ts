import dotenv from 'dotenv';
dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  CLIENT_ORIGIN: string;
}

export const getEnv = (): EnvConfig => {
  const rawPort = process.env.PORT || '5000';
  const PORT = parseInt(rawPort, 10);
  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    console.error('\x1b[31m%s\x1b[0m', `❌ [config] FATAL: Invalid PORT value "${rawPort}". Must be between 1 and 65535.`);
    process.exit(1);
  }

  const rawEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(rawEnv)) {
    console.error('\x1b[31m%s\x1b[0m', `❌ [config] FATAL: Invalid NODE_ENV "${rawEnv}". Must be 'development', 'production', or 'test'.`);
    process.exit(1);
  }
  const NODE_ENV = rawEnv as 'development' | 'production' | 'test';

  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const MONGODB_URI = process.env.MONGODB_URI || '';

  // Required MONGODB_URI validation (skips only in automated tests)
  if (!MONGODB_URI && NODE_ENV !== 'test') {
    console.error('\x1b[31m%s\x1b[0m', '❌ [config] FATAL: MONGODB_URI environment variable is required.');
    console.error('   Please define MONGODB_URI in server/.env or your deployment environment.');
    process.exit(1);
  }

  return {
    PORT,
    NODE_ENV,
    MONGODB_URI,
    CLIENT_ORIGIN
  };
};

export const env = getEnv();
