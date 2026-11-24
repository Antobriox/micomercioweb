import "server-only";

export function getAppOrigin() {
  try {
    const candidate = process.env.APP_ORIGIN ?? (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const url = new URL(candidate);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}
