import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = 
process.env.DATABASE_URL || 
"postgresql://postgres.xwrouybxxihamjyzknzf:lwazi12%3F@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";

const client = postgres(connectionString);
export const db = drizzle(client, { schema }); 