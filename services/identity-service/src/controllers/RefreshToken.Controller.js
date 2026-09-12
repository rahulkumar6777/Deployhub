import { refreshTokenService } from "../services/refreshToken.service.js";
import { getAccessTokenOptions, getRefreshTokenOptions } from "../utils/cookieOption.js";
import { clientIp } from "../../../../shared/utils/clientIp.js";
import { returnError } from "../../../../shared/errors/sendError.js";


export const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.cookies?.RefreshToken;

        const result = await refreshTokenService({
            refreshToken,
            ip: clientIp(req),
            userAgent: req.headers['user-agent']
        });

        return res
            .cookie('RefreshToken', result.RefreshToken, getRefreshTokenOptions())
            .cookie('AccessToken', result.AccessToken, getAccessTokenOptions())
            .json({ accessToken: result.AccessToken });

    } catch (error) {
        returnError(res, error)
    }
};
