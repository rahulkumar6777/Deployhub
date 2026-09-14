const free = {
    name: 'free',
    price: 0,
    deployment_Type: ['static'],
    subdomain: true,
    customDomain: false,
    ssl: true,
    alerts: {
        email: true,
        discord: true,
        telegram: true
    },
    github_Ci_Cd: false,
    ai_dignostics: false,
    uptime_monitoring: false,
}

const starter = {
    name: 'starter',
    price: 1499,
    deployment_Type: ['static', 'node', 'go', 'python'],
    subdomain: true,
    customDomain: true,
    ssl: true,
    alerts: {
        email: true,
        discord: true,
        telegram: true
    },
    github_Ci_Cd: true,
    ai_dignostics: false,
    uptime_monitoring: false,
    resources: {
        ram: '256mb',
        cpu: '0.5',
        storage: '5120'
    }
}

const pro = {
    name: 'pro',
    price: 2499,
    deployment_Type: ['static', 'node', 'go', 'python', 'java'],
    subdomain: true,
    customDomain: true,
    ssl: true,
    alerts: {
        email: true,
        discord: true,
        telegram: true
    },
    github_Ci_Cd: true,
    ai_dignostics: true,
    uptime_monitoring: true,
    resources: {
        ram: '512mb',
        cpu: '1',
        storage: '10240'
    }
}

export const plans = {
    free,
    starter,
    pro
}
