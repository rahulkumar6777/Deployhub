import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import { enforceIdentityAccessPolicy } from '../src/middlewares/identityAccessPolicy.js';
import { createRateLimitMiddleware, resolveIdentityPolicies } from '../src/middlewares/rateLimit.js';

const startGateway = async (t) => {
    const counts = new Map();
    const redis = {
        async eval(_script, _keyCount, key, windowSeconds) {
            assert.equal(windowSeconds, 300);
            const count = (counts.get(key) || 0) + 1;
            counts.set(key, count);
            return [count, windowSeconds];
        },
    };
    const app = express();
    app.use('/api/v1/auth', enforceIdentityAccessPolicy,
        createRateLimitMiddleware(resolveIdentityPolicies, { redisProvider: () => redis }),
        (_req, res) => res.sendStatus(204));
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
    }));
    await once(server, 'listening');
    return (path, method = 'GET') => fetch(
        `http://127.0.0.1:${server.address().port}/api/v1/auth${path}`, { method },
    );
};

test('every registered Identity route has a gateway rate limit', async () => {
    const source = await readFile(new URL(
        '../../../services/identity-service/src/routes/routes.js', import.meta.url,
    ), 'utf8');
    const routes = [...source.matchAll(/identityServiceRouter\.(get|post|delete|put|patch)\('([^']+)'/g)];
    assert.ok(routes.length > 0);
    for (const [, method, route] of routes) {
        const path = route.replace(':tokenId', '550e8400-e29b-41d4-a716-446655440000');
        assert.ok(resolveIdentityPolicies({ method: method.toUpperCase(), path }).length,
            `Missing rate limit: ${method.toUpperCase()} ${route}`);
    }
});

test('session endpoints enforce independent limits and changing token IDs cannot bypass them', async (t) => {
    const request = await startGateway(t);
    for (const [method, path] of [
        ['GET', () => '/sessions?view=active'],
        ['DELETE', () => '/sessions'],
        ['DELETE', (index) => `/sessions/token-${index}`],
    ]) {
        for (let index = 0; index < 30; index += 1) {
            const response = await request(path(index), method);
            assert.equal(response.status, 204, `${method} ${path(index)}`);
        }
        const blocked = await request(path(30), method);
        assert.equal(blocked.status, 429);
        assert.equal(blocked.headers.get('retry-after'), '300');
        assert.equal(blocked.headers.get('cache-control'), 'no-store');
        assert.equal((await blocked.json()).success, false);
    }
});

test('session access policy rejects unsupported methods and paths', async (t) => {
    const request = await startGateway(t);
    const list = await request('/sessions', 'POST');
    assert.equal(list.status, 405);
    assert.equal(list.headers.get('allow'), 'GET, DELETE');
    const single = await request('/sessions/token-1');
    assert.equal(single.status, 405);
    assert.equal(single.headers.get('allow'), 'DELETE');
    for (const path of ['/sessions/', '/sessions/token-1/extra', '/Sessions/token-1', '/unknown']) {
        assert.equal((await request(path, 'DELETE')).status, 404, path);
    }
});
