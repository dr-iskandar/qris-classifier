module.exports = {
  apps: [{
    name: 'qris-classifier',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/qris-classifier',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 9002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 9002
    },
    error_file: '/var/log/qris-classifier/error.log',
    out_file: '/var/log/qris-classifier/out.log',
    log_file: '/var/log/qris-classifier/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};