const fs = require("fs");

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const githubToken = process.env.GITHUB_TOKEN;
const eventName = process.env.GITHUB_EVENT_NAME;
const eventPath = process.env.GITHUB_EVENT_PATH;
const repo = process.env.GITHUB_REPOSITORY;

if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL");
if (!githubToken) throw new Error("Missing GITHUB_TOKEN");

const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
const [owner, repoName] = repo.split("/");

const marker = "<!-- discord-pr-message -->";

async function githubRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub request failed: ${res.status} ${await res.text()}`);
  }

  return res.status === 204 ? null : res.json();
}

async function sendDiscordMessage(content) {
  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      allowed_mentions: {
        parse: ["everyone"],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Discord send failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function deleteDiscordMessage(messageId) {
  const res = await fetch(`${webhookUrl}/messages/${messageId}`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Discord delete failed: ${res.status} ${await res.text()}`);
  }
}

async function findStoredComment(prNumber) {
  const comments = await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
  );

  return comments.find((comment) => comment.body.includes(marker));
}

async function storeMessageId(prNumber, messageId) {
  const body = `${marker}\nDiscord message ID: ${messageId}`;

  const existing = await findStoredComment(prNumber);

  if (existing) {
    await githubRequest(existing.url, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    return;
  }

  await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
  );
}

async function getStoredMessageId(prNumber) {
  const comment = await findStoredComment(prNumber);

  if (!comment) return null;

  const match = comment.body.match(/Discord message ID: (\d+)/);
  return match ? match[1] : null;
}

async function main() {
  if (eventName === "pull_request") {
    const pr = event.pull_request;

    const message = await sendDiscordMessage(
      `@everyone\n🔴 PR needs review: **#${pr.number} ${pr.title}**\n${pr.html_url}`,
    );

    await storeMessageId(pr.number, message.id);
    return;
  }

  if (eventName === "pull_request_review") {
    const review = event.review;

    if (review.state !== "approved") return;

    const prNumber = event.pull_request.number;
    const messageId = await getStoredMessageId(prNumber);

    if (!messageId) {
      console.log("No stored Discord message ID found.");
      return;
    }

    await deleteDiscordMessage(messageId);
  }
}

main();
