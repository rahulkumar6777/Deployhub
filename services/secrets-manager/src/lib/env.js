import { z } from 'zod';
import dotenv from 'dotenv'
import { print } from '../../../../shared/utils/print.js';


dotenv.config({
  quiet: true
})

const schema = z.object({

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  SERVICE_NAME: z.string().default('secrets-manager'),

  BOOTSTRAP_TOKEN: z.string().min(32, 'BOOTSTRAP_TOKEN too short — min 32 chars'),
  INTERNAL_SECRET: z.string().min(32),
  INTERNAL_SERVICE_TALKING_SECRET: z.string().min(32),

  //port of all services
  API_GATEWAY_PORT: z.coerce.number().default(4999),
  IDENTITY_SERVICE_PORT: z.coerce.number().default(4001),
  PROJECT_SERVICE_PORT: z.coerce.number().default(4002),
  BUILD_SERVICE_PORT: z.coerce.number().default(4003),
  DEPLOY_SERVICE_PORT: z.coerce.number().default(4004),
  NOTIFICATION_SERVICE_PORT: z.coerce.number().default(4006),
  MONITORING_SERVICE_PORT: z.coerce.number().default(4007),
  STREAM_SERVICE_PORT: z.coerce.number().default(4008),
  ANALYTICS_SERVICE_PORT: z.coerce.number().default(4009),
  ADMIN_SERVICE_PORT: z.coerce.number().default(4010),
  AGENT_SERVICE_PORT: z.coerce.number().default(4011),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string(),
  REDIS_TLS: z.string(),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRY: z.string().default('2h'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().length(64, 'Must be 32 bytes = 64 hex chars'),
  GITHUB_TOKEN_ENCRYPTION_KEY: z.string().length(64, 'Must be 32 bytes = 64 hex chars'),

  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(465),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),

  IDENTITY_SERVICE_MONGODB_URI: z.string().min(1),
  BUILD_SERVICE_MONGODB_URI: z.string().min(1),
  DEPLOY_SERVICE_MONGODB_URI: z.string().min(1),
  PROJECT_SERVICE_MONGODB_URI: z.string().min(1),
  MONITORING_MONGODB_URI: z.string().min(1),
  NOTIFICATION_MONGODB_URI: z.string().min(1),
  ADMIN_SERVICE_MONGODB_URI: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  DOCKER_USERNAME: z.string(),
  DOCKER_PASSWORD: z.string(),

  DOMAINDROP_API_KEY: z.string(),
  DOMAINDROP_SPACE_ID: z.string(),

  FRONTEND_URL: z.string(),
  ADMIN_FRONTEND_URL: z.string().default('http://localhost:5174'),

  RABBITMQ_URL: z.string(),

  // url of services
  IDENTITY_SERVICE_URL: z.string(),
  PROJECT_SERVICE_URL: z.string().optional(),
  MONITORING_SERVICE_URL: z.string().optional(),
  BUILD_SERVICE_URL: z.string().optional(),
  DEPLOY_SERVICE_URL: z.string().optional(),
  ANALYTICS_SERVICE_URL: z.string(),
  ADMIN_SERVICE_URL: z.string(),
  AGENT_SERVICE_URL: z.string(),


  // Groq for dashboard AI agent — comma-separated keys
  GROQ_API_KEYS: z.string().min(20),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  GROQ_KEY_COOLDOWN_SECONDS: z.coerce.number().default(60).optional(),

  ADMIN_ID: z.string().min(3),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_SESSION_SECRET: z.string().min(32),

  BCRYPT_ROUNDS: z.coerce.number().default(10),
})

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  print.error('\n❌  Secrets Manager — Missing/invalid env vars:\n');
  parsed.error.issues.forEach((i) => {
    print.error(`   • ${i.path.join('.')}: ${i.message}`);
  });
  print.error('\nFix .env and restart.\n');
  throw new Error('Secrets Manager missing/invalid env vars');
}

export const env = parsed.data;
