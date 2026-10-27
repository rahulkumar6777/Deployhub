import { buildApp } from "./app.js";
import { nodeVerify } from "./config/nodeVerify.js";

const app = await buildApp();



// jobs shedule
import './jobs/nodeverification.jobs.js'


console.log(process.env.NODE_MANAGER_URL)

const start = async (port) => {

    //await nodeVerify();

    app.listen(port, () => {
        console.log(`server is running on port ${port}`)
    })
};

start(process.env.PORT || 4522);