import crypto from 'node:crypto';
import { User } from '../models/user.model.js';
import { getRedis } from '../config/redis.js';
import { transporter } from '../utils/transporter.js';
import { env } from '../lib/env.js';
import { AppError } from '../../../../shared/errors/AppError.js';

const LOGIN_TTL = 5 * 60;
const SETUP_TTL = 5 * 60;

const digest = (value) =>
    crypto.createHash('sha256').update(value).digest('hex');

const constantEqual = (left, right) => {
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));

    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const keyFor = (secret) => /^[a-f0-9]{64}$/i.test(secret)
    ? Buffer.from(secret, 'hex')
    : Buffer.from(crypto.createHash('sha256').update(secret).digest());

const encrypt = (value) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        keyFor(env.GITHUB_TOKEN_ENCRYPTION_KEY),
        iv
    );
    const data = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final(),
    ]);

    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${data.toString('base64url')}`;
};

const decrypt = (value) => {
    const [iv, tag, data] = value.split('.');
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        keyFor(env.GITHUB_TOKEN_ENCRYPTION_KEY),
        Buffer.from(iv, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));

    return Buffer.concat([
        decipher.update(Buffer.from(data, 'base64url')),
        decipher.final(),
    ]).toString('utf8');
};

const base32 = (buffer) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let result = '';

    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;

        while (bits >= 5) {
            result += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits) {
        result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
};

const decodeBase32 = (text) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output = [];

    for (const char of text.replace(/=+$/, '').toUpperCase()) {
        const digit = alphabet.indexOf(char);

        if (digit < 0) {
            throw new AppError('Invalid authenticator code', 400);
        }

        value = (value << 5) | digit;
        bits += 5;

        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }

    return Buffer.from(output);
};

const totpAt = (secret, time = Date.now()) => {
    const counter = Math.floor(time / 30_000);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto
        .createHmac('sha1', decodeBase32(secret))
        .update(counterBuffer)
        .digest();
    const offset = hmac[hmac.length - 1] & 15;

    return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000)
        .padStart(6, '0');
};

// Accept only the current 30-second TOTP window. A previous-window code is expired.
const verifyTotp = (secret, code) =>
    constantEqual(totpAt(secret), code);

const requireLocal = (user) => {
    if (!user || user.provider !== 'local') {
        throw new AppError(
            'Two-factor authentication is available for email and password accounts only',
            403
        );
    }
};

const emailCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

const sendCode = async (user, code, subject = 'Your DeployHub sign-in code') =>
    transporter.sendMail({
        from: `"DeployHub" <${env.EMAIL_USER}>`,
        to: user.email,
        subject,
        text: `Your verification code is ${code}. It expires in 5 minutes. If you did not request this, secure your account.`,
    });

export const twoFactorStatus = async (userId) => {
    const user = await User.findById(userId)
        .select('provider twoFactorEnabled twoFactorMethod');
    requireLocal(user);

    return {
        enabled: Boolean(user.twoFactorEnabled),
        method: user.twoFactorMethod || null,
    };
};

export const beginTotpSetup = async (userId) => {
    const user = await User.findById(userId);
    requireLocal(user);

    const secret = base32(crypto.randomBytes(20));
    user.twoFactorPendingTotpSecret = encrypt(secret);
    await user.save();

    const label = encodeURIComponent(`DeployHub:${user.email}`);
    const issuer = encodeURIComponent('DeployHub');

    return {
        secret,
        otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
    };
};

export const enableTotp = async (userId, code) => {
    const user = await User.findById(userId)
        .select('+twoFactorPendingTotpSecret');
    requireLocal(user);

    if (!user.twoFactorPendingTotpSecret) {
        throw new AppError('Start authenticator setup first', 400);
    }

    const secret = decrypt(user.twoFactorPendingTotpSecret);
    if (!/^\d{6}$/.test(code || '') || !verifyTotp(secret, code)) {
        throw new AppError('Invalid authenticator code', 400);
    }

    user.twoFactorTotpSecret = encrypt(secret);
    user.twoFactorPendingTotpSecret = undefined;
    user.twoFactorMethod = 'totp';
    user.twoFactorEnabled = true;
    await user.save();

    return { enabled: true, method: 'totp' };
};

export const sendEmailSetupCode = async (userId) => {
    const user = await User.findById(userId);
    requireLocal(user);

    const code = emailCode();
    const redis = getRedis();
    await redis.set(
        `identity:2fa:setup:${userId}`,
        digest(code),
        'EX',
        SETUP_TTL
    );
    await sendCode(
        user,
        code,
        'Enable DeployHub email two-factor authentication'
    );
};

export const enableEmail2fa = async (userId, code) => {
    const redis = getRedis();
    const cacheKey = `identity:2fa:setup:${userId}`;
    const stored = await redis.get(cacheKey);
    const attemptsKey = `${cacheKey}:attempts`;

    if (!stored) {
        throw new AppError('Invalid or expired verification code', 400);
    }

    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
        await redis.expire(attemptsKey, SETUP_TTL);
    }

    if (attempts > 5) {
        await redis.del(cacheKey, attemptsKey);
        throw new AppError(
            'Too many invalid codes. Request another email code.',
            429
        );
    }

    if (!/^\d{6}$/.test(code || '') || !constantEqual(stored, digest(code))) {
        throw new AppError('Invalid or expired verification code', 400);
    }

    const user = await User.findById(userId);
    requireLocal(user);

    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'email';
    await user.save();
    await redis.del(cacheKey, attemptsKey);

    return { enabled: true, method: 'email' };
};

export const changeTwoFactorMethod = async (userId, method) => {
    if (!['email', 'totp'].includes(method)) {
        throw new AppError('Choose email or authenticator app', 400);
    }

    const user = await User.findById(userId)
        .select('+twoFactorTotpSecret');
    requireLocal(user);

    if (!user.twoFactorEnabled) {
        throw new AppError('Enable two-factor authentication first', 400);
    }

    if (method === 'totp' && !user.twoFactorTotpSecret) {
        throw new AppError('Set up your authenticator app first', 400);
    }

    user.twoFactorMethod = method;
    await user.save();

    return { enabled: true, method };
};

export const disableTwoFactor = async (userId) => {
    const user = await User.findById(userId);
    requireLocal(user);

    user.twoFactorEnabled = false;
    user.twoFactorMethod = null;
    user.twoFactorTotpSecret = undefined;
    user.twoFactorPendingTotpSecret = undefined;
    await user.save();

    const redis = getRedis();
    await redis.del(
        `identity:2fa:setup:${userId}`,
        `identity:2fa:setup:${userId}:attempts`
    );

    return { enabled: false, method: null };
};

export const createLoginChallenge = async (user) => {
    requireLocal(user);

    const challengeToken = crypto.randomBytes(32).toString('base64url');
    const redis = getRedis();
    await redis.set(
        `identity:2fa:login:${digest(challengeToken)}`,
        JSON.stringify({
            userId: String(user._id),
            attempts: 0,
        }),
        'EX',
        LOGIN_TTL
    );

    return {
        requiresTwoFactor: true,
        challengeToken,
        method: user.twoFactorMethod,
    };
};

export const sendLoginEmailCode = async (challengeToken) => {
    const redis = getRedis();
    const key = `identity:2fa:login:${digest(challengeToken || '')}`;
    const value = await redis.get(key);

    if (!value) {
        throw new AppError('Login verification expired. Sign in again.', 401);
    }

    const challenge = JSON.parse(value);
    const user = await User.findById(challenge.userId);
    requireLocal(user);

    if (!user.twoFactorEnabled || user.twoFactorMethod !== 'email') {
        throw new AppError('Email verification is not the selected method', 400);
    }

    const code = emailCode();
    await redis.set(`${key}:code`, digest(code), 'EX', LOGIN_TTL);
    await sendCode(user, code);

    return { message: 'Verification code sent to your account email' };
};

export const verifyLoginChallenge = async ({ challengeToken, code }) => {
    const redis = getRedis();
    const key = `identity:2fa:login:${digest(challengeToken || '')}`;
    const value = await redis.get(key);

    if (!value) {
        throw new AppError('Login verification expired. Sign in again.', 401);
    }

    const challenge = JSON.parse(value);
    const user = await User.findById(challenge.userId)
        .select('+twoFactorTotpSecret');
    requireLocal(user);

    if (!user.twoFactorEnabled) {
        throw new AppError('Two-factor authentication is no longer enabled', 401);
    }

    let valid = false;
    if (user.twoFactorMethod === 'totp') {
        valid = /^\d{6}$/.test(code || '') &&
            verifyTotp(decrypt(user.twoFactorTotpSecret), code);
    } else if (user.twoFactorMethod === 'email') {
        const expected = await redis.get(`${key}:code`);
        valid = Boolean(expected) &&
            /^\d{6}$/.test(code || '') &&
            constantEqual(expected, digest(code));
    }

    if (!valid) {
        challenge.attempts += 1;

        if (challenge.attempts >= 5) {
            await redis.del(key, `${key}:code`);
            throw new AppError('Too many invalid codes. Sign in again.', 429);
        }

        await redis.set(
            key,
            JSON.stringify(challenge),
            'EX',
            await redis.ttl(key)
        );
        throw new AppError('Invalid verification code', 401);
    }

    await redis.del(key, `${key}:code`);

    return user;
};
