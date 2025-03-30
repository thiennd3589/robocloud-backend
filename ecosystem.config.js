module.exports = {
  apps: [
    {
      name: 'robocloud backend',
      script: './main.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
