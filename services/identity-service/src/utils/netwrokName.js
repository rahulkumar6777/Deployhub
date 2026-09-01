import { v4 as uuidv4 } from 'uuid';

export const generateNetworkName = (userId) => {
    return `dh-user-${userId}-${uuidv4().slice(0, 8)}`;
};