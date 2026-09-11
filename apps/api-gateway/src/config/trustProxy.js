import { isIP } from 'node:net';

const isExplicitAddressOrCidr = (entry) => {
    const [address, prefix, extra] = entry.split('/');
    if (extra !== undefined) return false;

    const version = isIP(address);
    if (!version) return false;
    if (prefix === undefined) return true;
    if (!/^\d+$/.test(prefix)) return false;

    const prefixLength = Number(prefix);
    return prefixLength >= 1 && prefixLength <= (version === 4 ? 32 : 128);
};

export const parseTrustedProxyCidrs = (raw = '') => {
    const value = raw.trim();
    if (!value || value.toLowerCase() === 'false') return false;

    const entries = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    if (entries.length === 0) return false;

    if (entries.some((entry) => !isExplicitAddressOrCidr(entry))) {
        throw new Error('TRUSTED_PROXY_CIDRS must contain only explicit proxy IPs or CIDRs');
    }

    return entries;
};
