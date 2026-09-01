import nodemailer from "nodemailer";
import { env } from "../lib/env.js";

export const transporter = nodemailer.createTransport({
    host: `${env.EMAIL_HOST}`,
    port: 465,
    secure: true,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});