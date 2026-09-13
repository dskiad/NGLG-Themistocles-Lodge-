import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const lodgeContent = sqliteTable("lodge_content", {
 id: text("id").primaryKey(),
 content: text("content").notNull(),
 revision: integer("revision").notNull(),
 updatedAt: text("updated_at").notNull(),
 ownerId: text("owner_id").notNull(),
});
