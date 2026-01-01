module.exports = {
  apps: [
    {
      name: 'claude-server',
      script: 'server/index.js',
      cwd: 'E:\\claudecodeui',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: '3001'
      }
    },
    {
      name: 'claude-client',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host',
      cwd: 'E:\\claudecodeui',
      watch: false
    }
  ]
};