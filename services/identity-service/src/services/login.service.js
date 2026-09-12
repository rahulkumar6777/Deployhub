import { User } from "../models/user.model.js";
import sanatize from 'mongo-sanitize';
import { AppError } from "../../../../shared/errors/AppError.js";

export const login = async (data) => {

    const sanatizeData = sanatize(data);

    const { email, password } = sanatizeData;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError('Invalid Credentials', 404);
    }


    if (user.provider !== 'local') {
        throw new AppError('This Account login with OAuth', 400);
    }

    if (user.status !== 'active') {
        throw new AppError('Please verify your email before login', 403);
    }

    if (user.isLocked()) {
        throw new AppError('Account temporarily locked. Try again in 15 minutes.', 423);
    }


    const verifyPassword = await user.comparePassword(password);

    if (!verifyPassword) {
        await user.incrementLoginAttempts();
        throw new AppError('Invalid Credentials', 401);
    };

    await user.resetLoginAttempts();

    return user
}
