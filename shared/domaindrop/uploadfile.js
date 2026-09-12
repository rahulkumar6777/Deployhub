import { domainDropFilesPathKey } from "./filesPathkey.js"
import { progressLogger } from "./uploadProgress.js"


export const uplaodFileOnDomainDrop = async ({ domainDrop, DomainDropError, spaceId, file, filename, mimeType, label, userId }) => {
    try {

        const res = await domainDrop.files.upload({
            spaceId: spaceId,
            path: domainDropFilesPathKey.profilePic(filename, userId),
            file: file,
            mimeType: mimeType,
            concurrency: 4,
            retries: 2,
            onProgress: progressLogger(label),
        })
        return res;

    } catch (error) {
        if (error instanceof DomainDropError) {
            return {
                name: error.name,
                message: error.message,
                status: error.status,
                payload: error.payload,
            }
        } else {
            return {
                error: error.message
            }
        }
    }
}