import { AppError } from "../../../../shared/errors/AppError.js";
import { User } from "../models/user.model.js";
import { DomainDrop, DomainDropError } from '@domaindrop/node'
import { uplaodFileOnDomainDrop } from "../../../../shared/domaindrop/uploadfile.js";
import axios from "axios";
import { decryptGithubAccessToken } from "../utils/githubTokenCrypto.js";
import { domainDrop } from "../../../../shared/domaindrop/domaindrop.js";
import { env } from "../lib/env.js";
import { deleteFromDomainDrop } from "../../../../shared/domaindrop/delete.js";
import { getFileUrlDomainDrop } from "../../../../shared/domaindrop/getfileUrl.js";


export const userFullnameService = async (userId, fullName) => {

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, provider: 'local' },
        { fullName: fullName },
        { returnDocument: 'after', runValidators: true });

    if (!updatedUser) {
        throw new AppError('You cannot update fullname, you logged in with GitHub', 409)
    }

    return updatedUser

}

export const userProfilePicService = async (userId, file) => {

    const drop = await domainDrop({ DomainDrop, apiKey: env.DOMAINDROP_API_KEY });

    if (!file?.path) {
        throw new AppError('Profile picture is required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.provider !== 'local') {
        throw new AppError('You cannot update profile picture, you logged in with GitHub', 409)
    }


    const oldProfilePicFileId = user?.profileFileId;


    const uplaodResult = await uplaodFileOnDomainDrop({
        domainDrop: drop,
        DomainDropError, file: file.path,
        filename: file.filename,
        mimeType: file.mimetype,
        userId,
        spaceId: env.DOMAINDROP_SPACE_ID,
        label: 'profile'
    });

    const profilePicUrl = await getFileUrlDomainDrop({ domainDrop: drop, fileId: uplaodResult.id, DomainDropError })

    const updateUser = await User.findOneAndUpdate(
        { _id: userId },
        { profileFileId: uplaodResult.id, profilePic: profilePicUrl },
        { returnDocument: 'after', upsert: false }
    );

    console.log(oldProfilePicFileId)
    if (oldProfilePicFileId) {
        await deleteFromDomainDrop({
            domainDrop: drop,
            filename: oldProfilePicFileId,
            DomainDropError
        });
    }

    return updateUser
}


export const getUserRepositories = async (userId) => {
    const user = await User.findById(userId).select('+githubAccessToken');

    if (!user) {
        throw new AppError('User not found', 404);
    }


    if (user.provider !== 'github') {
        throw new AppError('User is not authenticated with GitHub', 400);
    };

    if (!user.githubAccessToken) {
        throw new AppError('GitHub access token not found! Please authenticate with GitHub', 404);
    }

    const githubAccessToken = decryptGithubAccessToken(user.githubAccessToken);
    const repositories = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const reposRes = await axios.get("https://api.github.com/user/repos", {
            headers: {
                Authorization: `Bearer ${githubAccessToken}`,
                Accept: "application/vnd.github+json",
            },
            params: {
                visibility: "all",
                affiliation: "owner,collaborator",
                per_page: 100,
                page,
            },
            timeout: 10000,
        });

        repositories.push(...reposRes.data);
        hasMore = reposRes.data.length === 100;
        page += 1;
    }


    const repos = repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        html_url: repo.html_url,
        description: repo.description,
        default_branch: repo.default_branch,
    }));

    return repos;
}

export const getUSerNetworkName = async (userId) => {

    const user = await User.findById(userId).select('networkName');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user.networkName;
}

export const getUserGIthubToken = async (userId) => {

    const user = await User.findById(userId).select('+githubAccessToken');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.provider !== 'github') {
        throw new AppError('User is not authenticated with GitHub', 400);
    };

    if (!user.githubAccessToken) {
        throw new AppError('GitHub access token not found! Please authenticate with GitHub', 404);
    }

    return decryptGithubAccessToken(user.githubAccessToken);

}