
export const QUEUE_NAMES = {
    GLOBAL: 'deployhub-global-build-deploy',
    GLOBAL_RETRY: "deployhub-global-build-deploy-retry",
    BUILD_NODE: (nodeId) => `deployhub-build-${nodeId}`,
    DEPLOY_NODE: (nodeId) => `deployhub-deploy-${nodeId}`,
    BUILD_STATUS_QUEUE: "deployhub-build-status-updates",
    PROJECT_STATUS_UPDATE_QUEUE: "deployhub-project-status-updates",
    DEPLOY_STATUS_QUEUE: "deployhub-deploy-status-updates"
};
