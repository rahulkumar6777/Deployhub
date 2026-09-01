import axios from "axios";
import { env } from "../lib/env.js";
import { User } from "../models/user.model.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from "../config/redis.js";
import { encryptGithubAccessToken } from "../utils/githubTokenCrypto.js";
import { generateNetworkName } from "../utils/netwrokName.js";
import { cacheKey } from "../../../../shared/cache/cacheKey.js";


const GITHUB_REQUEST_TIMEOUT_MS = 10000;


export const githubCallback = async (data) => {

    const { code, state } = data;

    if (!code) {
        throw new AppError('github code missing', 400);
    };

    if (!state) {
        throw new AppError('GitHub OAuth state missing', 400);
    }

    const consumedState = await getRedis().del(cacheKey.createGithubOAuthStateKey(state));
    if (!consumedState) {
        throw new AppError('Invalid or expired GitHub OAuth state', 400);
    }

    // exange code to access token
    const tokenRes = await axios.post("https://github.com/login/oauth/access_token",
        {
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code
        },
        {
            headers: {
                accept: "application/json"
            },
            timeout: GITHUB_REQUEST_TIMEOUT_MS
        }
    );


    const githubAccessToken = tokenRes.data.access_token;

    if (!githubAccessToken) {
        throw new AppError('GitHub token failed', 502);
    }

    // Get GitHub Profile
    const userRes = await axios.get("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${githubAccessToken}`,
        },
        timeout: GITHUB_REQUEST_TIMEOUT_MS,
    });

    const githubUser = userRes.data;

    // Get Email
    const emailRes = await axios.get("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${githubAccessToken}`,
        },
        timeout: GITHUB_REQUEST_TIMEOUT_MS,
    });

    const primaryEmail = emailRes.data.find(e => e.primary && e.verified)?.email;

    if (!primaryEmail) {
        throw new AppError('Verified primary email not found in GitHub', 400);
    }

    let user = await User.findOne({ email: primaryEmail });
    const encryptedGithubAccessToken = encryptGithubAccessToken(githubAccessToken);

    if (!user) {


        user = new User({
            email: primaryEmail,
            fullName: githubUser.name || githubUser.login,
            githubId: githubUser.id,
            githubUsername: githubUser.login,
            profilePic: githubUser.avatar_url,
            githubAccessToken: encryptedGithubAccessToken,
            provider: "github",
            status: "active",
            password: null,
        });

        const networkName = generateNetworkName(user._id);

        user.networkName = networkName
        await user.save({ validateBeforeSave: false })

    } else {
        if (user.provider !== "github") {
            throw new AppError('Email already registered with password login. Please sign in and link GitHub from account settings.', 409);
        }

        if (user.status === 'suspend') {
            throw new AppError('Your account has been suspended Due to You break some rules', 403);
        }

        user.githubAccessToken = encryptedGithubAccessToken;
        user.githubId = githubUser.id;
        user.githubUsername = githubUser.login;
        user.profilePic = githubUser.avatar_url;
        user.status = "active";
        await user.save({ validateBeforeSave: false });
    }

    return user;
}

