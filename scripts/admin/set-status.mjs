// npm run resource:status -- <resource-id> <draft|published|archived>
import { adminClients, fail } from "./_env.mjs";
const [id, status] = process.argv.slice(2);
if (!id || !["draft", "published", "archived"].includes(status)) fail("Usage: npm run resource:status -- <resource-id> <draft|published|archived>");
const { db } = adminClients();
const { data, error } = await db.from("resources").update({ status, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", id).select("id, title, status").maybeSingle();
if (error) fail("Update failed.", error.message);
if (!data) fail(`No resource with id ${id}.`);
console.log(`✓ "${data.title}" is now ${data.status}.`);
