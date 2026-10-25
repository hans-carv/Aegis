import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_teocat_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '4h',
};