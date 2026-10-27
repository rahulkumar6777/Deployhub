import { buildApp } from "./app.js";

const app = await buildApp();




const start = async (port) => {
    app.listen(port, () => {
        console.log(`server is running on port ${port}`)
    })
};

start(process.env.PORT || 4522);