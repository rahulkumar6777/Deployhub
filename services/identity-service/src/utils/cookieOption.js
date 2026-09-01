import { env } from "../lib/env.js";

const baseOptions = {
  httpOnly: true
};

export const getAccessTokenOptions = () => ({
  ...baseOptions,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "Strict" : "Lax",
  expires: new Date(Date.now() + 2 * 60 * 60 * 1000)
});

export const getRefreshTokenOptions = () => ({
  ...baseOptions,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "Strict" : "Lax",
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

export const getGithubOAuthStateCookieOptions = () => ({
  ...baseOptions,
  secure: env.NODE_ENV === "production",
  sameSite: "Lax",
  maxAge: 10 * 60 * 1000
});

export const getClearGithubOAuthStateCookieOptions = () => ({
  ...baseOptions,
  secure: env.NODE_ENV === "production",
  sameSite: "Lax"
});

export const getClearAccessTokenOptions = () => ({
  ...baseOptions,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "Strict" : "Lax"
});

export const getClearRefreshTokenOptions = () => ({
  ...getClearAccessTokenOptions(),
  domain: env.NODE_ENV === "production" ? ".deployhub.cloud" : undefined
});
