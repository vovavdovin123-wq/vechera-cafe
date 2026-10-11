export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { startTelegramPoller } = await import("@/lib/telegram-poller");
  await startTelegramPoller();
}
