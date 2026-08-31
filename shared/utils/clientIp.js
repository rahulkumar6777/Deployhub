export function clientIp(req) {
    let ip =
        req.ip ||
        req.headers['x-real-ip'] ||
        (typeof req.headers['x-forwarded-for'] === 'string'
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : null) ||
        req.socket?.remoteAddress ||
        'unknown';

    ip = String(ip).trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    if (ip === '::1') ip = '127.0.0.1';
    return ip;
}
