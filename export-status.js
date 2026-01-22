import fs from "fs";
import path from "path";

const URL = "https://squan.cortechnology.net/api/status-page/squan";
const OUT_DIR = ".";
const OUT_FILE = path.join(OUT_DIR, "status.json");

async function main() {
  try {
    const res = await fetch(URL, { headers: { "cache-control": "no-cache" }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const minimal = {
      fetchedAt: new Date().toISOString(),
      page: {
        slug: data?.statusPage?.slug,
        title: data?.statusPage?.title,
        description: data?.statusPage?.description
      },
      services: (data?.publicGroupList || []).map(group => ({
        id: group?.id,
        name: group?.name,
        monitors: (group?.monitorList || []).map(m => ({
          id: m?.id,
          name: m?.name,
          status: m?.status,              // 1 = up, 0 = down, 2 = pending/unknown
          lastPing: m?.lastPing,
          avgResponse: m?.avgResponseTime
        }))
      }))
    };

    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(minimal, null, 2));
    console.log("✅ Exported status to", OUT_FILE);
  } catch (err) {
    console.error("❌ Failed to fetch status:", err.message);

    // Fail gracefully: keep last-good status.json if it exists,
    // and write an error flag for the front-end to show a banner.
    const errorFile = path.join(OUT_DIR, "error.json");
    fs.writeFileSync(
      errorFile,
      JSON.stringify({ error: "Fetch failed", timestamp: new Date().toISOString() }, null, 2)
    );
    process.exit(0); // don't fail the action; mirror still serves last known good
  }
}

main();