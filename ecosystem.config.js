module.exports = {
  apps: [
    {
      name: 'robocloud backend',
      script: './node_modules/.bin/env-cmd -f .env.production node main.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
