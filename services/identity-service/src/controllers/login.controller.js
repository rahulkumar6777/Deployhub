import { validationResult } from 'express-validator';
import { login } from '../services/login.service.js';
import { generateToken } from '../services/session.service.js';
import { getRefreshTokenOptions } from '../utils/cookieOption.js';


export const loginController = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: errors.array()[0].msg
            })
        };

        const user = await login(req.body);
        const { AccessToken, RefreshToken } = await generateToken(user._id, req);

        return res
            .cookie('RefreshToken', RefreshToken, getRefreshTokenOptions())
            .status(200)
            .json({
                success: true,
                message: 'Login Successful',
                AccessToken
            });

    } catch (error) {
        res.status(error.status || 500).json({
            message: error.msg || "Internal server Error"
        })
    }
}
