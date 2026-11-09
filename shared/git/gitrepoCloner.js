import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const makeGitEnv = (githubToken) => {
    const env = { ...process.env };
    if (!githubToken) return env;

    const configuredCount = Number.parseInt(env.GIT_CONFIG_COUNT || '0', 10);
    const index = Number.isInteger(configuredCount) && configuredCount >= 0 ? configuredCount : 0;
    env.GIT_CONFIG_COUNT = String(index + 1);
    env[`GIT_CONFIG_KEY_${index}`] = 'http.https://github.com/.extraheader';
    env[`GIT_CONFIG_VALUE_${index}`] = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${githubToken}`).toString('base64')}`;
    return env;
};

const runGit = (args, { githubToken, cwd } = {}) => {
    try {
        return execFileSync('git', args, {
            cwd,
            env: makeGitEnv(githubToken),
            stdio: 'inherit',
        });
    } catch (error) {
        const message = String(error.message || 'Git command failed')
            .replace(/https:\/\/[^\s/@]+:[^\s/@]+@github\.com/gi, 'https://github.com')
            .replace(/https:\/\/[^\s/@]+@github\.com/gi, 'https://github.com');
        const safeError = new Error(message);
        safeError.code = error.code;
        safeError.status = error.status;
        throw safeError;
    }
};

export class GitCloner {

    static clone({
        repoUrl,
        branch,
        targetPath,
        githubToken,
        folderName
    }) {

        if (
            !folderName ||
            folderName.trim() === "" ||
            folderName.trim() === "."
        ) {
            runGit(['clone', '-b', branch, repoUrl, targetPath], { githubToken });

            return;
        }

        runGit(['clone', '-b', branch, '--filter=blob:none', '--sparse', repoUrl, targetPath], { githubToken });

        runGit(['-C', targetPath, 'sparse-checkout', 'set', folderName]);

        const sourceDir = path.join(
            targetPath,
            ...folderName.split("/")
        );

        const files = fs.readdirSync(sourceDir);

        for (const file of files) {
            fs.renameSync(
                path.join(sourceDir, file),
                path.join(targetPath, file)
            );
        }

        // remove leftover folders
        const firstFolder = folderName.split("/")[0];

        const rootFolderPath = path.join(
            targetPath,
            firstFolder
        );

        if (fs.existsSync(rootFolderPath)) {
            fs.rmSync(rootFolderPath, {
                recursive: true,
                force: true
            });
        }
    }
}
