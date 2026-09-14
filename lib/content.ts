import { z } from "zod";
const label = z.string().trim().min(1, "Συμπληρώστε το πεδίο.").max(300);
const optional = z.string().trim().max(300);
const asset = z.string().max(2000).refine(v => /^\/(?!\/)/.test(v) || /^https:\/\//i.test(v), "Χρησιμοποιήστε σύνδεσμο https ή διαδρομή εικόνας.");
const assetOptional = z.union([z.literal(""), asset]).default("");
const linkOptional = z.union([z.literal(""), z.string().trim().url().max(2000).refine(v => v.startsWith("https://"), "Ο σύνδεσμος πρέπει να αρχίζει με https://")]).default("");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v + "T12:00:00Z"); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; }, "Ελέγξτε την ημερομηνία.");
export const personSchema = z.object({ id: label, role: label, title: optional, firstName: label, lastName: label });
export const contentSchema = z.object({
  grandTitle: label, lodgeType: label, lodgeName: label, lodgeNumber: label,
  grandEmblem: asset, lodgeEmblem: asset, waxSeal: asset,
  officersTitle: label, scheduleTitle: label, season: label,
  venue: label, venueIntro: label, pastTitle: label, applicationTitle: label,
  applicationUrl: z.string().url().max(2000).refine(v => v.startsWith("https://"), "Ο σύνδεσμος πρέπει να αρχίζει με https://"),
  footer: label,
  secretaryEmail: z.string().trim().email().max(254).default("themistocles096@gmail.com"),
  secretaryEmailLabel: label.default("Στείλτε email στον Αδ. Γραμματέα"),
  officers: z.array(personSchema).min(1).max(60),
  events: z.array(z.object({ id: label, date, title: label, image: assetOptional, link: linkOptional })).max(150),
  pastMasters: z.array(z.object({ id: label, title: optional, firstName: label, lastName: label })).max(200),
});
export type LodgeContent = z.infer<typeof contentSchema>;
export const contentResponseSchema = z.object({ content: contentSchema, revision: z.number().int().min(0), updatedAt: z.string().nullable(), canEdit: z.boolean() });
export const savedResponseSchema = contentResponseSchema.omit({canEdit:true}).extend({updatedAt:z.string()});
export type Person = z.infer<typeof personSchema>;
export const initialContent: LodgeContent = {
  grandTitle: "Εθνική Μεγάλη Στοά της Ελλάδος",
  lodgeType: "Συμβολική Στοά", lodgeName: "Θεμιστοκλής", lodgeNumber: "υπ’ αριθμ. 96",
  grandEmblem: "/images/nglg-emblem.png", lodgeEmblem: "/images/lodge-emblem.jpg", waxSeal: "/images/lodge-seal.png",
  officersTitle: "Αξιωματικοί της Στοάς", scheduleTitle: "Πρόγραμμα εργασιών", season: "2026 — 2027",
  venueIntro: "Η Στοά εργάζεται στο", venue: "Τεκτονικό Μέγαρο Πειραιώς",
  pastTitle: "Μητρώο Πρώην Σεβασμίων", applicationTitle: "Αίτηση Νέου Μέλους",
  applicationUrl: "https://dskiad.github.io/NGLG-AITHSH/",
  footer: "Power and Engineering by the Dimitrios Skiadopoulos",
  secretaryEmail: "themistocles096@gmail.com",
  secretaryEmailLabel: "Στείλτε email στον Αδ. Γραμματέα",
  officers: [
    {id:"master", role:"Σεβάσμιος Διδ.", title:"Αδ.", firstName:"Νικόλαος", lastName:"Μωραΐτης"},
    {id:"secretary", role:"Γραμματέας", title:"Αδ.", firstName:"Αθανάσιος", lastName:"Ζαχαρόπουλος"},
  ],
  events: [
    {id:"e1", date:"2026-09-14", title:"17:30 — Πρόβα μύησης 1ου βαθμού και συμμετοχή στην έκτακτη μεγάλη συνέλευση της επαρχίας μας.", image:"", link:""},
    {id:"e2", date:"2026-09-20", title:"11:00 — BBQ του ΜΔ μας, να φάμε και να πιούμε και να στηρίξουμε την υποτροφία «Στέφανος Παιπέτης» για τα παιδιά των Αδελφών μας.", image:"", link:""},
    {id:"e3", date:"2026-10-01", title:"20:00 — Ομιλία του αδελφού μας Σπύρου Σκιαδοπούλου στην στοά Τριπτόλεμος στο Μέγαρο της Ερεσού στην Αθήνα. Επίσημη επίσκεψη της στοάς ως Θεμιστοκλής.", image:"", link:""},
    {id:"e4", date:"2026-10-13", title:"20:00 — Τελετή εισδοχής. Πρώτη συνεδρία της χρονιάς και πιθανώς μύηση των 2 υποψηφίων κυρίων.", image:"", link:""},
    {id:"e5", date:"2026-11-06", title:"20:00 — Εκδρομή της στοάς μας στην Ρόδο στην στοά Κάμειρος. Μύηση στον 2ο βαθμό των τεσσάρων αδελφών μας.", image:"", link:""},
    {id:"e6", date:"2026-11-10", title:"Ομιλία", image:"", link:""},
    {id:"e7", date:"2026-12-08", title:"Ομιλία", image:"", link:""},
    {id:"e8", date:"2027-01-12", title:"Τελετή διέλευσης", image:"", link:""},
    {id:"e9", date:"2027-02-09", title:"Ομιλία", image:"", link:""},
    {id:"e10", date:"2027-03-09", title:"Ομιλία", image:"", link:""},
    {id:"e11", date:"2027-04-13", title:"Ομιλία", image:"", link:""},
    {id:"e12", date:"2027-05-11", title:"Τελετή έγερσης", image:"", link:""},
    {id:"e13", date:"2027-06-08", title:"Εγκατάσταση νέων αρχών", image:"", link:""},
  ],
  pastMasters: [
    {id:"p1", title:"", firstName:"Δημήτριος", lastName:"Σκιαδόπουλος"},
    {id:"p2", title:"", firstName:"Σπυρίδων", lastName:"Σκιαδόπουλος"},
    {id:"p3", title:"", firstName:"Γεώργιος", lastName:"Μαρτσούκος"},
    {id:"p4", title:"", firstName:"Δημήτριος", lastName:"Σιώνης"},
    {id:"p5", title:"", firstName:"Δημήτριος", lastName:"Ζωγραφάκης"},
    {id:"p6", title:"", firstName:"Σωτήριος", lastName:"Χαραλάμπους"},
  ],
};
export function fullName(p: {title:string; firstName:string; lastName:string}) { return [p.title,p.firstName,p.lastName].filter(Boolean).join(" "); }
export function eventParts(value: string) {
  const d = new Date(value + "T12:00:00Z");
  return { day: String(d.getUTCDate()).padStart(2,"0"), month: new Intl.DateTimeFormat("el-GR",{month:"long",timeZone:"UTC"}).format(d).toLocaleUpperCase("el-GR"), year:d.getUTCFullYear(), weekday: new Intl.DateTimeFormat("el-GR",{weekday:"long",timeZone:"UTC"}).format(d) };
}
