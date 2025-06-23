// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: 'mila-plus-api',
            script: 'src/server.js',
            // Opções para ambiente de DESENVOLVIMENTO
            env_development: {
                NODE_ENV: 'development',
                watch: true, // Substitui o nodemon
                ignore_watch: ['node_modules', 'logs'],
            },
            // Opções para ambiente de PRODUÇÃO
            env_production: {
                NODE_ENV: 'production',
                instances: 'max', // Modo Cluster para máxima performance
                exec_mode: 'cluster',
            },
        },
        {
            name: 'mila-plus-worker',
            script: 'worker.js',
            // O worker não precisa de modo cluster
            exec_mode: 'fork',
            // Opções para ambiente de DESENVOLVIMENTO
            env_development: {
                NODE_ENV: 'development',
                watch: true, // Worker também reinicia com alterações
                ignore_watch: ['node_modules', 'logs'],
            },
            // Opções para ambiente de PRODUÇÃO
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
}
