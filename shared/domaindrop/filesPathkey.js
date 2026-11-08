export const domainDropFilesPathKey = {
    profilePic: (filename, userId) => `users/${userId}/profile-pic/${filename}`,
    logsFile: (projectId, buildFileName) => `projects/${projectId}/builds/${buildFileName}`
}