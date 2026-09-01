import { cacheKey } from "../../../../shared/cache/cacheKey.js";
import { getRedis } from "../config/redis.js";
import { env } from "../lib/env.js";
import { githubCallback } from "../services/github.service.js";
import { generateToken } from "../services/session.service.js";
import { getAccessTokenOptions, getClearGithubOAuthStateCookieOptions, getGithubOAuthStateCookieOptions, getRefreshTokenOptions } from "../utils/cookieOption.js";
import crypto from 'crypto';


const GITHUB_OAUTH_STATE_TTL_SECONDS = 10 * 60;

export const githubLoginController = async (req, res) => {
    const state = crypto.randomBytes(32).toString('hex');
    const redis = getRedis();

    await redis.set(cacheKey.createGithubOAuthStateKey(state), '1', 'EX', GITHUB_OAUTH_STATE_TTL_SECONDS);

    const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: 'repo user:email',
        state,
    });

    const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return res
        .cookie('GithubOAuthState', state, getGithubOAuthStateCookieOptions())
        .redirect(redirectUrl);
};



export const githubCallbackController = async (req, res) => {
    try {
        const incomingState = req.query?.state;
        const cookieState = req.cookies?.GithubOAuthState;

        if (!incomingState || !cookieState || incomingState !== cookieState) {
            return res
                .clearCookie('GithubOAuthState', getClearGithubOAuthStateCookieOptions())
                .status(400)
                .json({ message: 'Invalid GitHub OAuth state' });
        }

        const user = await githubCallback(req.query);

        const { AccessToken, RefreshToken } = await generateToken(user._id, req);

        return res
            .clearCookie('GithubOAuthState', getClearGithubOAuthStateCookieOptions())
            .cookie('AccessToken', AccessToken, getAccessTokenOptions())
            .cookie('RefreshToken', RefreshToken, getRefreshTokenOptions())
            .redirect(`${env.FRONTEND_URL}/`);

    } catch (error) {
        return res
            .clearCookie('GithubOAuthState', getClearGithubOAuthStateCookieOptions())
            .status(error.status || 500)
            .json({
                message: error.msg || 'OAuth Login Failed'
            })
    }
};
