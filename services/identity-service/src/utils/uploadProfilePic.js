import { domainDropFilesPathKey } from "../../../../shared/domaindrop/filesPathkey.js";
import { progressLogger } from "../../../../shared/domaindrop/uploadProgress.js";
import { drop } from "../config/fileUploaderChecker.js";
import { DomainDropError } from '@domaindrop/node'
import fs from 'fs'

export const uploadProfilePic = async (userId, filePath, label) => {
    try {
        const file = await drop.files.upload({
            spaceId: createdSpace.id,
            path: domainDropFilesPathKey.profilePic(userId),
            file: filePath,
            concurrency: 4,
            retries: 2,
            onProgress: progressLogger(label),
        });

        return file;

    } catch (error) {
        if (error instanceof DomainDropError) {
            show('DomainDrop API error', {
                name: error.name,
                message: error.message,
                status: error.status,
                payload: error.payload,
            })
        } else {
            console.error(error)
            throw new Error('Failed to upload profile picture: ' + error.message);
        }
    } finally {
        await drop.close();
        await fs.promises.unlink(filePath);
    }
}