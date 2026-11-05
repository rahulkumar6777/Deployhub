
export const QUEUE_NAMES = {
    GLOBAL: 'deployhub-global-build-deploy',
    GLOBAL_RETRY: "deployhub-global-build-deploy-retry",
    BUILD_NODE: (nodeId) => `deployhub-build-${nodeId}`,
    DEPLOY_NODE: (nodeId) => `deployhub-deploy-${nodeId}`,
    BUILD_STATUS_QUEUE: "deployhub-build-status-updates",
    DEPLOY_STATUS_QUEUE: "deployhub-deploy-status-updates",
    BUILD_DATA_UPDATE_QUEUE: "deployhub-build-data-update",
    DEPLOY_DATA_UPDATE_QUEUE: "deployhub-deploy-data-update",
};