import cron from 'node-cron';
import { nodeVerify } from '../config/nodeVerify.js';

cron.schedule('* * * * *', async () => {
  
    await nodeVerify();
});