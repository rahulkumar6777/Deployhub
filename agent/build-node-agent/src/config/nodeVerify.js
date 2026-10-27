import axios from "axios";

const NODE_MANAGER_URLS = process.env.NODE_MANAGER_URL;


export const nodeVerify = async () => {


    const nodeId = process.env.NODE_ID;
    const nodeSecret = process.env.NODE_SECRET;

    const response = await axios.post(`${NODE_MANAGER_URLS}/api/v1/nodes/${nodeId}/verify`,
        {
            secret: nodeSecret,
        },
        {
            timeout: 10000,
        }
    );


    if (response.status !== 200) {
        process.exit(1);
    }

    console.log("node verified");
}