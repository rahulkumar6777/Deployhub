export const getSecretsForService = async (serviceName) => {
    const registry = {

    }

    return registry[serviceName] ?? null;
}

export function getRegisteredServices() {
    return [
    ];
}