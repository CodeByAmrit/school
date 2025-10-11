module.exports = {
  apps: [
    {
      name: 'student-tracker',
      script: './bin/www',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      ignore_watch: ['node_modules', 'logs'],
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
