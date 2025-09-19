module.exports = {
  apps: [{
    name: 'camera-streaming-backend',
    script: 'dist/main.js',
    cwd: '/home/getfairplay-api/htdocs/api.getfairplay.org',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/getfairplay-api/logs/error.log',
    out_file: '/home/getfairplay-api/logs/out.log',
    log_file: '/home/getfairplay-api/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    autorestart: true,
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log'
    ],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    source_map_support: true,
    instance_var: 'INSTANCE_ID'
  }],

  deploy: {
    production: {
      user: 'camera-streaming',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/camera-streaming-platform.git',
      path: '/var/www/camera-streaming',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};