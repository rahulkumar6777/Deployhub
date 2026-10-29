import { buildApp } from "./app.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";


const app = await buildApp();


const startApp = async (port) => {

    await connectRabbitMQ();
    
    app.listen(port, () => {
        console.log(`server is running on local host port ${port}`);
    });
};

await startApp(process.env.PORT || 4523);
 