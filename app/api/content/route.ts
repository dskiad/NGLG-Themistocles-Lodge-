import { NextResponse } from "next/server";
import { contentSchema } from "@/lib/content";
import { readContent, writeContent } from "@/lib/content-store";
import { z } from "zod";
export const dynamic = "force-dynamic";
const headers={"Cache-Control":"no-store"};
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers});}
function user(request:Request){return request.headers.get("oai-authenticated-user-id")&&request.headers.get("oai-authenticated-user-email")?request.headers.get("oai-authenticated-user-id"):null;}
export async function GET(request:Request) {
  try {const state=await readContent();const id=user(request);return reply({content:state.content,revision:state.revision,updatedAt:state.updatedAt,canEdit:!!id&&(!state.ownerId||state.ownerId===id)});}
  catch(error){console.error("Failed to load lodge content",error);return reply({error:"Δεν ήταν δυνατή η φόρτωση των στοιχείων. Δοκιμάστε ξανά."},503);}
}
export async function PUT(request:Request) {
  const userId=user(request);
  if(!userId)return reply({error:"Συνδεθείτε ξανά για να αποθηκεύσετε. Οι αλλαγές σας διατηρούνται."},401);
  if(request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Η αποθήκευση επιτρέπεται μόνο από τη σελίδα διαχείρισης."},403);
  if(!request.headers.get("content-type")?.includes("application/json"))return reply({error:"Μη έγκυρη μορφή δεδομένων."},415);
  const raw=await request.text();if(raw.length>100000)return reply({error:"Τα στοιχεία υπερβαίνουν το επιτρεπόμενο μέγεθος."},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:"Μη έγκυρα στοιχεία."},400);}
  const parsed=z.object({content:contentSchema,revision:z.number().int().min(0)}).safeParse(body);
  if(!parsed.success)return reply({error:"Ελέγξτε τα ονόματα, τους τίτλους, τις ημερομηνίες και τους συνδέσμους."},400);
  try {
    const current=await readContent();
    if(current.ownerId&&current.ownerId!==userId)return reply({error:"Μόνο ο διαχειριστής μπορεί να αλλάξει τα στοιχεία."},403);
    const result=await writeContent(parsed.data.content,parsed.data.revision,userId);
    if(!result)return reply({error:"Η σελίδα ενημερώθηκε από άλλη συσκευή. Οι δικές σας αλλαγές διατηρούνται για έλεγχο."},409);
    return reply(result);
  }catch(error){console.error("Failed to save lodge content",error);return reply({error:"Η αποθήκευση δεν ολοκληρώθηκε. Οι αλλαγές σας διατηρούνται. Δοκιμάστε ξανά."},503);}
}
