
export const QUEUE_NAMES = {
    GLOBAL: 'deployhub-global-build-deploy',
    GLOBAL_RETRY: "deployhub-global-build-deploy-retry",
    BUILD_NODE: (nodeId) => `deployhub-build-${nodeId}`,
    DEPLOY_NODE: (nodeId) => `deployhub-deploy-${nodeId}`,
};