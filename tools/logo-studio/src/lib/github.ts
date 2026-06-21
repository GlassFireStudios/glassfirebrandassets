// Server-side GitHub helpers. The PAT never leaves the server.

import { Octokit } from "@octokit/rest";
import type { RenderedFile } from "./types";

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
}

export function getConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const repoFull = process.env.GITHUB_REPO || "GlassFireStudios/glassfirebrandassets";
  const baseBranch = process.env.GITHUB_BASE_BRANCH || "main";
  if (!token) throw new Error("GITHUB_TOKEN is not configured.");
  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) throw new Error(`GITHUB_REPO must be "owner/repo", got "${repoFull}".`);
  return { token, owner, repo, baseBranch };
}

function client(cfg: GitHubConfig): Octokit {
  return new Octokit({ auth: cfg.token });
}

export interface PublishResult {
  commitSha: string;
  branch: string;
  htmlUrl: string;
  createdBranch: boolean;
}

/** Commit a set of writes and/or deletes atomically as a single tree commit. If
 *  the target branch does not exist and createBranch is true, it is branched off
 *  the base branch. */
export async function commitChanges(
  writes: RenderedFile[],
  deletes: string[],
  message: string,
  branch: string,
  createBranch: boolean,
): Promise<PublishResult> {
  if (!writes.length && !deletes.length) throw new Error("Nothing to commit.");
  const cfg = getConfig();
  const gh = client(cfg);
  const { owner, repo, baseBranch } = cfg;

  // Resolve the parent commit: prefer the target branch if it already exists.
  let parentSha: string;
  let branchExists = false;
  try {
    const ref = await gh.git.getRef({ owner, repo, ref: `heads/${branch}` });
    parentSha = ref.data.object.sha;
    branchExists = true;
  } catch {
    const ref = await gh.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
    parentSha = ref.data.object.sha;
  }

  if (!branchExists && !createBranch) {
    throw new Error(`Branch "${branch}" does not exist and createBranch is false.`);
  }

  const parentCommit = await gh.git.getCommit({ owner, repo, commit_sha: parentSha });
  const baseTreeSha = parentCommit.data.tree.sha;

  // Upload blobs for writes.
  const blobs = await Promise.all(
    writes.map(async (f) => {
      const blob = await gh.git.createBlob({ owner, repo, content: f.base64, encoding: "base64" });
      return { path: f.path, sha: blob.data.sha };
    }),
  );

  const tree: {
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  }[] = [
    ...blobs.map((b) => ({ path: b.path, mode: "100644" as const, type: "blob" as const, sha: b.sha })),
    // sha: null deletes the path.
    ...deletes.map((p) => ({ path: p, mode: "100644" as const, type: "blob" as const, sha: null })),
  ];

  const newTree = await gh.git.createTree({ owner, repo, base_tree: baseTreeSha, tree });

  const commit = await gh.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.data.sha,
    parents: [parentSha],
  });

  if (branchExists) {
    await gh.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha });
  } else {
    await gh.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: commit.data.sha });
  }

  return {
    commitSha: commit.data.sha,
    branch,
    createdBranch: !branchExists,
    htmlUrl: `https://github.com/${owner}/${repo}/commit/${commit.data.sha}`,
  };
}

/** Convenience wrapper for writes-only commits. */
export function publishFiles(
  files: RenderedFile[],
  message: string,
  branch: string,
  createBranch: boolean,
): Promise<PublishResult> {
  return commitChanges(files, [], message, branch, createBranch);
}

/** Fetch a UTF-8 file from the repo (e.g. the manifest). Returns null if absent. */
export async function getTextFile(path: string, ref?: string): Promise<string | null> {
  const cfg = getConfig();
  const gh = client(cfg);
  try {
    const res = await gh.repos.getContent({
      owner: cfg.owner,
      repo: cfg.repo,
      path,
      ref: ref || cfg.baseBranch,
    });
    if (!Array.isArray(res.data) && res.data.type === "file" && res.data.content) {
      return Buffer.from(res.data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

/** List entries in a repo directory. Returns names of subdirectories + files. */
export async function listDir(
  path: string,
  ref?: string,
): Promise<{ name: string; type: "dir" | "file"; path: string }[]> {
  const cfg = getConfig();
  const gh = client(cfg);
  try {
    const res = await gh.repos.getContent({
      owner: cfg.owner,
      repo: cfg.repo,
      path,
      ref: ref || cfg.baseBranch,
    });
    if (Array.isArray(res.data)) {
      return res.data.map((e) => ({
        name: e.name,
        type: e.type === "dir" ? "dir" : "file",
        path: e.path,
      }));
    }
    return [];
  } catch {
    return [];
  }
}
