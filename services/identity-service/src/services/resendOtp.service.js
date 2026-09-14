import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from "../config/redis.js";
import { env } from "../lib/env.js";
import { User } from "../models/user.model.js";
import { transporter } from "../utils/transporter.js";

const otpType = [
    'registration'
]

const typeRedisCacheKey = {
    registration: (email) => cacheKey.UserOtp(email)
}

export const resendOtp = async (type, email) => {

    const redis = getRedis();

    if (!otpType.includes(type)) {
        throw new Error(`Invalid OTP type: ${type}`);
    };

    if (type === 'registration') {
        const user = await User.findOne({ email });
        if (user) {
            throw new AppError("you cannot send registration otp, beacuse you already registered", 400)
        }
    } else {
        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError("User not Found", 404)
        }
    }

    const redisKey = typeRedisCacheKey.registration(email)
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

}