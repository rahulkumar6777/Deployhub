import cron from 'node-cron';
import { nodeVerify } from '../config/nodeVerify.js';

cron.schedule('0 3 * * *', async () => {
    try {
        await nodeVerify();
        console.log('nodeVerify completed successfully');
    } catch (error) {
        process.exit(1);
    }
});