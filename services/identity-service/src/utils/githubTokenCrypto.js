import crypto from 'crypto';
import { AppError } from '../../../../shared/errors/AppError.js';
import { env } from '../lib/env.js';

const ENCRYPTION_PREFIX = 'enc:v1:';

const getEncryptionKey = () => {
    const secret = env.GITHUB_TOKEN_ENCRYPTION_KEY;

    if (!secret) {
        throw new AppError('GitHub token encryption key is not configured', 500);
    }

    if (/^[a-f0-9]{64}$/i.test(secret)) {
        return Buffer.from(secret, 'hex');
    }

    const base64Key = Buffer.from(secret, 'base64');
    if (base64Key.length === 32) {
        return base64Key;
    }

    return crypto.createHash('sha256').update(secret).digest();
};

export const encryptGithubAccessToken = (token) => {
    if (!token) {
        throw new AppError('GitHub access token is required', 500);
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(token, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTION_PREFIX}${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

export const decryptGithubAccessToken = (storedToken) => {
    if (!storedToken) {
        return storedToken;
    }

    if (!storedToken.startsWith(ENCRYPTION_PREFIX)) {
        return storedToken;
    }

    const [iv, authTag, encrypted] = storedToken
        .slice(ENCRYPTION_PREFIX.length)
        .split('.');

    if (!iv || !authTag || !encrypted) {
        throw new AppError('Invalid stored GitHub token format', 500);
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        getEncryptionKey(),
        Buffer.from(iv, 'base64url')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64url')),
        decipher.final(),
    ]).toString('utf8');
};
