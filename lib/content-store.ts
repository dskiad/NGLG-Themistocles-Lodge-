import { env } from "cloudflare:workers";
import { initialContent, contentSchema, type LodgeContent } from "./content";
type Row = {content:string;revision:number;updated_at:string;owner_id:string};
function db():D1Database {
  const database=(env as unknown as {DB?:D1Database}).DB;
  if(!database)throw new Error("DB binding is unavailable");
  return database;
}
export async function readContent() {
  const row=await db().prepare("SELECT content, revision, updated_at, owner_id FROM lodge_content WHERE id = ?").bind("main").first<Row>();
  if(!row)return {content:initialContent,revision:0,updatedAt:null,ownerId:null};
  return {content:contentSchema.parse(JSON.parse(row.content)),revision:row.revision,updatedAt:row.updated_at,ownerId:row.owner_id};
}
export async function writeContent(content:LodgeContent,revision:number,userId:string) {
  const updatedAt=new Date().toISOString();
  const result=await db().prepare(`INSERT INTO lodge_content (id,content,revision,updated_at,owner_id)
    SELECT ?, ?, 1, ?, ? WHERE ? = 0
    ON CONFLICT(id) DO NOTHING`).bind("main",JSON.stringify(content),updatedAt,userId,revision).run();
  if(revision===0)return result.meta.changes===1?{content,revision:1,updatedAt}:null;
  const update=await db().prepare("UPDATE lodge_content SET content = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? AND owner_id = ?").bind(JSON.stringify(content),updatedAt,"main",revision,userId).run();
  return update.meta.changes===1?{content,revision:revision+1,updatedAt}:null;
}
