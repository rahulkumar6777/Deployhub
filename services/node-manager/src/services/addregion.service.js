import { AppError } from "../../../../shared/errors/AppError.js";
import { Region } from "../models/region.model.js";


export const addRegionService = async (regionData) => {

    const { name, code } = regionData;

    const existingRegion = await Region.findOne({ code });
    if (existingRegion) {
        throw new AppError("Region with this code already exists" , 409);
    }

    const region = new Region({
        name,
        code
    });

    await region.save();

    return region;
}