import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export class GitCloner {

    static clone({
        repoUrl,
        branch,
        targetPath,
        githubToken,
        folderName
    }) {

        const repoUrlWithAuth = githubToken
            ? repoUrl.replace(
                "https://github.com/",
                `https://${githubToken}@github.com/`
            )
            : repoUrl;

        if (
            !folderName ||
            folderName.trim() === "" ||
            folderName.trim() === "."
        ) {
            execSync(
                `git clone -b ${branch} ${repoUrlWithAuth} ${targetPath}`,
                {
                    stdio: "inherit",
                    shell: false
                }
            );

            return;
        }

        execSync(
            `git clone -b ${branch} --filter=blob:none --sparse ${repoUrlWithAuth} ${targetPath}`,
            {
                stdio: "inherit",
                shell: false
            }
        );

        execSync(
            `git -C ${targetPath} sparse-checkout set ${folderName}`,
            {
                stdio: "inherit",
                shell: false
            }
        );

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