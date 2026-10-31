module.exports = {
  apps: [
    {
      name: 'mixingvault',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: 'C:/Users/VM Servers/Downloads/Kerpbot2/Mixing Vault/Stem Vault',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3002,
        NODE_ENV: 'production',
      },
    },
  ],
};
