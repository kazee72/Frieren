import { db } from "./client.js";

export interface Link {
  name: string;
  url: string;
  category: string | null;
  subcategory: string | null;
  starred: number;
}

export function searchLinks(query: string): Link[] {
  const pattern = `%${query.toLowerCase()}%`;

  const stmt = db.prepare(`
    SELECT name, url, category, subcategory, starred
    FROM link
    WHERE lower(name) LIKE ? OR lower(category) LIKE ? OR lower(subcategory) LIKE ?
    ORDER BY starred DESC, name ASC
    LIMIT 5
  `);

  return stmt.all(pattern, pattern, pattern) as Link[];
}
