import { Octokit } from '@octokit/rest';

function base64Encode(str) {
  if (typeof window !== "undefined" && typeof btoa !== "undefined") {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let binary = "";
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return btoa(binary);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  throw new Error("No base64 encoding available");
}
function base64Decode(str) {
  if (typeof window !== "undefined" && typeof atob !== "undefined") {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString("utf-8");
  }
  throw new Error("No base64 decoding available");
}
function getSlugFromPath(path) {
  const match = path.match(/src\/content\/blog\/(.+)\.md/);
  return match ? match[1] : "";
}
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) {
    return {
      frontmatter: {
        title: "",
        description: "",
        date: (/* @__PURE__ */ new Date()).toISOString(),
        author: "OpenClaude Team",
        tags: [],
        category: "技术",
        draft: false,
        featured: false
      },
      content
    };
  }
  const frontmatterLines = match[1].split("\n");
  const frontmatter = {};
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      } else if (value.startsWith("[") && value.endsWith("]")) {
        value = value.slice(1, -1).split(",").map((v) => v.trim().replace(/['"]/g, "")).filter((v) => v);
      }
      frontmatter[key] = value;
    }
  }
  return {
    frontmatter,
    content: match[2]
  };
}
function generateFrontmatter(post) {
  const tags = post.tags.map((t) => `'${t}'`).join(", ");
  return `---
title: '${post.title}'
description: '${post.description}'
date: ${post.date}
author: '${post.author}'
tags: [${tags}]
category: '${post.category}'
${post.draft !== void 0 ? `draft: ${post.draft}` : ""}
${post.featured ? "featured: true" : ""}
${post.image ? `image: '${post.image}'` : ""}
---

`;
}
function createGitHubClient(token) {
  return new Octokit({
    auth: token
  });
}
async function getAllPosts(token, owner, repo) {
  const octokit = createGitHubClient(token);
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "src/content/blog"
    });
    const data = response.data;
    if (!Array.isArray(data)) {
      return [];
    }
    const posts = [];
    for (const file of data) {
      if (file.type !== "file" || !file.name.endsWith(".md")) continue;
      try {
        const fileResponse = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.path
        });
        const fileData = fileResponse.data;
        if ("content" in fileData && fileData.content) {
          const content = base64Decode(fileData.content);
          const { frontmatter, content: markdown } = parseFrontmatter(content);
          posts.push({
            ...frontmatter,
            slug: getSlugFromPath(file.path),
            content: markdown,
            sha: fileData.sha
          });
        }
      } catch (err) {
        console.error(`Error reading file ${file.path}:`, err);
      }
    }
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}
async function getPost(token, owner, repo, slug) {
  const octokit = createGitHubClient(token);
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`
    });
    const data = response.data;
    if ("content" in data && data.content) {
      const content = base64Decode(data.content);
      const { frontmatter, content: markdown } = parseFrontmatter(content);
      return {
        ...frontmatter,
        slug,
        content: markdown,
        sha: data.sha
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}
async function createPost(token, owner, repo, slug, post, content) {
  const octokit = createGitHubClient(token);
  try {
    const fullContent = generateFrontmatter(post) + content;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
      message: `Create blog post: ${post.title}`,
      content: base64Encode(fullContent)
    });
    return true;
  } catch (error) {
    console.error("Error creating post:", error);
    return false;
  }
}
async function updatePost(token, owner, repo, slug, post, content, sha) {
  const octokit = createGitHubClient(token);
  try {
    const fullContent = generateFrontmatter(post) + content;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
      message: `Update blog post: ${post.title}`,
      content: base64Encode(fullContent),
      sha
    });
    return true;
  } catch (error) {
    console.error("Error updating post:", error);
    return false;
  }
}
async function deletePost(token, owner, repo, slug, sha) {
  const octokit = createGitHubClient(token);
  try {
    await octokit.rest.repos.deleteFile({
      owner,
      repo,
      path: `src/content/blog/${slug}.md`,
      message: `Delete blog post: ${slug}`,
      sha
    });
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}
function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "");
}

export { getAllPosts as a, generateSlug as b, createPost as c, deletePost as d, getPost as g, updatePost as u };
