import { db } from "../db/client.js";
import { migrate } from "../db/schema.js";

interface Link {
  name: string;
  url: string;
  category: string | null;
  subcategory: string | null;
  starred: number;
}

async function seedLinks(): Promise<void> {
  try {
    console.log("Fetching FMHY data...");
    const response = await fetch("https://api.fmhy.net/single-page");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const markdown = await response.text();
    const lines = markdown.split("\n");

    let currentCategory: string | null = null;
    let currentSubcategory: string | null = null;
    const links: Link[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Category heading: # ► Category Name
      if (trimmed.startsWith("# ►")) {
        currentCategory = trimmed.replace(/^#\s*►\s*/, "").trim();
        currentSubcategory = null;
        continue;
      }

      // Subcategory heading: ## ▷ Subcategory Name
      if (trimmed.startsWith("## ▷")) {
        currentSubcategory = trimmed.replace(/^##\s*▷\s*/, "").trim();
        continue;
      }

      // Starred link: * ⭐
      if (trimmed.startsWith("* ⭐")) {
        // Skip cross-references and indexes
        if (trimmed.includes("* ↪️") || trimmed.includes("* 🌐")) {
          continue;
        }

        // Extract first markdown link [Name](url)
        const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (!linkMatch) continue;

        const fullName = linkMatch[1];
        const url = linkMatch[2];

        // Skip reddit.com links
        if (url.includes("reddit.com")) continue;

        // Extract name before first dash if present
        const name = fullName.split(" - ")[0].trim();

        links.push({
          name,
          url,
          category: currentCategory,
          subcategory: currentSubcategory,
          starred: 1,
        });
      }
    }

    console.log(`Parsed ${links.length} starred links from FMHY`);

    // Ensure DB is migrated
    migrate();

    // Drop all existing links and re-insert
    console.log("Clearing existing links...");
    db.prepare("DELETE FROM link").run();

    console.log("Inserting new links...");
    const insert = db.prepare(`
      INSERT INTO link (name, url, category, subcategory, starred)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const link of links) {
      insert.run(link.name, link.url, link.category, link.subcategory, link.starred);
    }

    console.log(`Successfully imported ${links.length} starred links`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed links:", error);
    process.exit(1);
  }
}

seedLinks();
