import axios from "axios";

const NODE_MANAGER_URLS = process.env.NODE_MANAGER_URL;


export const nodeVerify = async () => {

    const nodeId = process.env.NODE_ID;
    const nodeSecret = process.env.NODE_SECRET;

    const resources = await getNodeResources();

    const response = await axios.post(`${NODE_MANAGER_URLS}/api/v1/nodes/${nodeId}/verify`,
        {
            secret: nodeSecret,
        },
        {
            timeout: 10000,
        }
    );

    if (response.status !== 200) {
        throw new Error(`Node verification failed with status ${response.status}`);
    }

    console.log("node verified")
}