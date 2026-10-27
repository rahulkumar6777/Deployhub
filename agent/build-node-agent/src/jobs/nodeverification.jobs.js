import cron from 'node-cron';
import { nodeVerify } from '../config/nodeVerify.js';

cron.schedule('* * * * *', async () => {
    try {
        await nodeVerify();
        console.log('nodeVerify completed successfully');
    } catch (error) {
        process.exit(1);
    }
});