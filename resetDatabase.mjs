import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`delete from "anime" where true`);

// await client.execute('SELECT count(1) FROM "anime" WHERE id = 3');
