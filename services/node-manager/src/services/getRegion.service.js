import { AppError } from '../../../../shared/errors/AppError.js';
import { Region } from '../models/region.model.js';

export const getRegionsService = async () => {

    const regions = await Region.find();

    return regions;
}

export const getRegionByIdService = async (regionId) => {

    const region = await Region.findById(regionId);

    if (!region) {
        throw new AppError("Region not found", 404);
    }

    return region;
}