import { AppError } from "../../../../../shared/errors/AppError.js";
import { Build } from "../../models/build.model.js";

export const getBuild = async (userId, buildId) => {

    const builds = await Build.findOne({ userId, _id: buildId }).lean();

    if (!builds) throw new AppError("invalid buildId", 404)

    return builds;
}


