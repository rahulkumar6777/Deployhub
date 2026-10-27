
export const QUEUE_NAMES = {
    GLOBAL: 'deployhub-global-build-deploy',
    BUILD_NODE: (nodeId) => `deployhub-build-${nodeId}`,
    DEPLOY_NODE: (nodeId) => `deployhub-deploy-${nodeId}`,
};