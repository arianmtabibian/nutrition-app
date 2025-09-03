module.exports = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 10000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
  DB_PATH: process.env.DB_PATH || '/tmp/nutrition.db',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://*.vercel.app'
};
