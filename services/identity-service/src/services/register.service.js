import { User } from "../models/user.model.js";
import { AppError } from '../../../../shared/errors/AppError.js'
import { getRedis } from "../config/redis.js";
import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { env } from "../lib/env.js";
import { transporter } from "../utils/transporter.js";

const RegistrationExpiryMs = 10 * 60 * 1000;
const getRegistrationExpiry = () => new Date(Date.now() + RegistrationExpiryMs);


export const initRegister = async (data) => {

    const redis = getRedis()
    if (!data) {
        throw new AppError('Data Required', 400);
    }

    const { fullName, email, password } = data;

    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
        throw new AppError("User with this email Alreadt exist", 409)
    }

    const user = new User({
        fullName,
        email,
        password,
        status: "pending",
        registrationExpiresAt: getRegistrationExpiry()
    })

    const redisKey = cacheKey.UserOtp(user.email);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis
        .multi()
        .hset(redisKey, {
            email: user.email,
            otp
        })
        .expire(redisKey, 600)
        .exec();

    await transporter.sendMail({
        from: `"Deployhub" <${env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your Registration Otp',
        text: `Your Registration otp is ${otp}`
    });

    await user.save({ validateBeforeSave: false });

    return user;
}

export const verifyRegister = async (data) => {

    const { otp, email } = data;
    if (!data) {
        throw new AppError('Data Required', 400);
    }

    const redis = getRedis();
    const redisKey = cacheKey.UserOtp(email);

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('Registration expired. Please register again', 400);
    }
    if (user.status === 'active') {
        throw new AppError('Account already verified', 409);
    }

    if (user.status !== 'pending') {
        throw new AppError('Registration cannot be verified for this account', 403);
    }

    if (user.registrationExpiresAt && user.registrationExpiresAt <= new Date()) {
        await User.deleteOne({ _id: user._id, status: "pending" });
        throw new AppError('Registration expired. Please register again', 400);
    }

    const cachedOtp = await redis.hgetall(redisKey);
    console.log('cachedOtp', cachedOtp)
    if (!cachedOtp || !cachedOtp.otp) {
        throw new AppError('Registration expired. Please register again', 400);
    }

    if (cachedOtp.email !== email) {
        throw new AppError('Invalid email', 400);
    }

    if (otp !== cachedOtp.otp) {
        throw new AppError('Invalid otp', 400);
    }

    await User.findOneAndUpdate(
        {
            _id: user._id,
            status: "pending"
        },
        {
            $set: { status: "active" },
            $unset: { registrationExpiresAt: "" }
        },
        {
            returnDocument: 'after'
        }
    );

    redis.del(redisKey);
    return user;

}
