/**
 * On-demand ISR revalidation.
 *
 * Call after saving content in WordPress (webhook, plugin, or manual):
 *   POST /api/revalidate?secret=YOUR_SECRET&path=/
 *   POST /api/revalidate?secret=YOUR_SECRET&path=/airports/
 *
 * Set REVALIDATE_SECRET in the frontend env (Atlas / .env).
 */
export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const secret =
    (req.query.secret || req.body?.secret || "").toString().trim();
  const expected = (process.env.REVALIDATE_SECRET || "").trim();

  if (!expected || secret !== expected) {
    return res.status(401).json({ message: "Invalid secret" });
  }

  const rawPath = (req.query.path || req.body?.path || "/").toString();
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  try {
    await res.revalidate(path);
    return res.json({ revalidated: true, path });
  } catch (err) {
    return res.status(500).json({
      message: "Error revalidating",
      error: err?.message || String(err),
      path,
    });
  }
}
