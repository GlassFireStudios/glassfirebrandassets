// Minimal Slack DM helper for the machine-tracker idle nudge. Needs a bot token
// (SLACK_BOT_TOKEN) with scopes: users:read.email + chat:write.

export const slackConfigured = () => !!process.env.SLACK_BOT_TOKEN;

export async function slackDM(email: string, text: string): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || !email) return false;
  try {
    const look = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (!look.ok || !look.user?.id) return false;
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ channel: look.user.id, text }),
    }).then((r) => r.json());
    return !!res.ok;
  } catch {
    return false;
  }
}
