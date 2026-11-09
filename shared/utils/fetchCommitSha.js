export const fetchCommitSha = async (repoUrl, branch, githubAccessToken) => {
    try {
        let owner, repo;
        const httpsMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/);
        const sshMatch = repoUrl.match(/github\.com[:]([^\/]+)\/([^\/\.]+)(\.git)?$/);
        if (httpsMatch) {
            owner = httpsMatch[1];
            repo = httpsMatch[2];
        } else if (sshMatch) {
            owner = sshMatch[1];
            repo = sshMatch[2];
        } else {
            throw new Error('Invalid GitHub repo URL');
        }

        const headers = { "Accept": "application/vnd.github.v3+json" };
        if (githubAccessToken) headers.Authorization = `Bearer ${githubAccessToken}`;

        const encodedBranch = encodeURIComponent(branch);
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodedBranch}`,
            { headers }
        );

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`GitHub API error ${res.status}: ${errorText}`);
            return null;
        }

        const data = await res.json();
        return data?.object?.sha || null;
    } catch (err) {
        console.error("fetchCommitSha failed:", err);
        return null;
    }
};