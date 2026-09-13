import { DomainDrop } from '@domaindrop/node'
import { env } from '../lib/env.js'
import { print } from '../../../../shared/utils/print.js'
import { domainDrop } from '../../../../shared/domaindrop/domaindrop.js'


export const checkFileUploaderReady = async () => {


    const drop = await domainDrop({
        DomainDrop,
        apiKey: env.DOMAINDROP_API_KEY
    });
    const spaceId = env.DOMAINDROP_SPACE_ID

    try {
        const response = await drop.spaces.get(spaceId);
        if (!response) {
            throw new Error(`File Uploader is not ready`);
        }
        print.log(`File Uploader is ready and space name is ${response.name}`);
    } catch (error) {
        throw new Error(`File Uploader is not ready: ${error.message}`)
    }
}