module.exports = {
  apps: [{
    name: 'trustnet-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
