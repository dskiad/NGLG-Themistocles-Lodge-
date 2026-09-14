"use client";
import { useEffect, useState, useRef } from "react";
import { ArrowDown, ArrowUp, Check, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { contentSchema, savedResponseSchema, LodgeContent, fullName } from "@/lib/content";

type Props = {content:LodgeContent;revision:number;updatedAt:string|null;onSaved:(c:LodgeContent,r:number,t:string)=>void};
const DRAFT_KEY = "themistocles96-unsaved-draft";
function Field({label,value,onChange,type="text",placeholder=""}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string}) {
  return <label className="editor-field"><span>{label}</span><input type={type} value={value} maxLength={type==="url"?2000:300} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;
}
function timestamp(value:string) {return new Intl.DateTimeFormat("el-GR",{dateStyle:"short",timeStyle:"medium",timeZone:"Europe/Athens"}).format(new Date(value));}

export default function Editor({content,revision,updatedAt,onSaved}:Props) {
  const [draft,setDraft] = useState<LodgeContent>(()=>structuredClone(content));
  const [tab,setTab] = useState("general");
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  const [saveError,setSaveError] = useState(false);
  const [restored,setRestored] = useState(false);
  const [draftReady,setDraftReady] = useState(false);
  const [conflict,setConflict] = useState(false);
  const saveLock=useRef(false);
  const dirty=JSON.stringify(draft)!==JSON.stringify(content);
  useEffect(()=>{
    try {const text=sessionStorage.getItem(DRAFT_KEY);if(text){const saved=JSON.parse(text);if(saved.revision===revision&&saved.content&&JSON.stringify(saved.content)!==JSON.stringify(content)){setDraft(saved.content);setRestored(true);}}}catch{}
    setDraftReady(true);
  },[]);
  useEffect(()=>{if(!draftReady)return;try{if(dirty)sessionStorage.setItem(DRAFT_KEY,JSON.stringify({revision,content:draft}));else sessionStorage.removeItem(DRAFT_KEY);}catch{}},[draft,revision,dirty,draftReady]);
  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  function set<K extends keyof LodgeContent>(key:K,value:LodgeContent[K]) {setDraft(d=>({...d,[key]:value}));setMessage("");setSaveError(false);}
  function move(key:"officers"|"events"|"pastMasters",index:number,delta:number) {
    setDraft(d=>{const rows=[...d[key]];[rows[index],rows[index+delta]]=[rows[index+delta],rows[index]];return {...d,[key]:rows};});setMessage("");
  }
  function remove(key:"officers"|"events"|"pastMasters",index:number) {
    const snapshot=structuredClone(draft);
    setDraft(d=>({...d,[key]:d[key].filter((_,i)=>i!==index)}));
    toast("Η εγγραφή αφαιρέθηκε από τις αλλαγές.",{action:{label:"Αναίρεση",onClick:()=>setDraft(d=>({...d,[key]:snapshot[key]}))}});
  }
  function tools(key:"officers"|"events"|"pastMasters",index:number,label:string) {return <div className="editor-record-head"><span className="editor-record-label">{label}</span>{key!=="events"&&<><button className="icon-button" aria-label="Μετακίνηση προς τα επάνω" disabled={index===0||saving} onClick={()=>move(key,index,-1)}><ArrowUp size={15}/></button><button className="icon-button" aria-label="Μετακίνηση προς τα κάτω" disabled={index===draft[key].length-1||saving} onClick={()=>move(key,index,1)}><ArrowDown size={15}/></button></>}<button className="icon-button" aria-label={`Αφαίρεση: ${label}`} disabled={saving||(key==="officers"&&draft.officers.length===1)} onClick={()=>remove(key,index)}><Trash2 size={15}/></button></div>;}
  async function save() {
    if(saveLock.current||!dirty||conflict)return;
    const result=contentSchema.safeParse(draft);
    if(!result.success){
      const issue=result.error.issues[0]; const group=String(issue.path[0]);
      setTab(["officers","events","pastMasters"].includes(group)?group:"general");
      const entry=typeof issue.path[1]==="number"?` στην εγγραφή ${issue.path[1]+1}`:"";
      setMessage(`Ελέγξτε τα πεδία${entry}. Συμπληρώστε τα ονόματα, τους τίτλους και έγκυρες ημερομηνίες ή συνδέσμους.`);setSaveError(true);return;
    }
    saveLock.current=true;setSaving(true);setMessage("Αποθήκευση αλλαγών…");setSaveError(false);
    try {
      const r=await fetch("/api/content",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:result.data,revision})});
      const raw=await r.json();
      if(!r.ok){if(r.status===409)setConflict(true);throw new Error(typeof raw==="object"&&raw!==null&&"error" in raw&&typeof raw.error==="string"?raw.error:"Η αποθήκευση δεν ολοκληρώθηκε. Οι αλλαγές σας διατηρούνται.");}
      const response=savedResponseSchema.parse(raw);
      setDraft(response.content);onSaved(response.content,response.revision,response.updatedAt);setRestored(false);
      try{sessionStorage.removeItem(DRAFT_KEY);}catch{}
      setMessage(`Οι αλλαγές αποθηκεύτηκαν και εμφανίζονται στη σελίδα. ${timestamp(response.updatedAt)} (ώρα Ελλάδας).`);
      toast.success("Η σελίδα ενημερώθηκε επιτυχώς.");
    }catch(e){setMessage(e instanceof Error?e.message:"Η αποθήκευση δεν ολοκληρώθηκε. Δοκιμάστε ξανά.");setSaveError(true);}
    finally{setSaving(false);saveLock.current=false;}
  }
  const generalFields:[keyof LodgeContent,string][]=[
    ["grandTitle","Τίτλος Μεγάλης Στοάς"],["lodgeType","Τίτλος Στοάς"],["lodgeName","Όνομα Στοάς"],["lodgeNumber","Αριθμός Στοάς"],
    ["officersTitle","Τίτλος ενότητας αξιωματικών"],["scheduleTitle","Τίτλος προγράμματος"],["season","Περίοδος εργασιών"],
    ["venueIntro","Κείμενο τόπου εργασιών"],["venue","Τόπος εργασιών"],["pastTitle","Τίτλος μητρώου"],
    ["applicationTitle","Κείμενο κουμπιού αίτησης"],["applicationUrl","Σύνδεσμος αίτησης νέου μέλους"],["footer","Κείμενο υποσέλιδου"],
  ];
  return <div className="editor-body">
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="editor-tabs"><TabsTrigger value="general">Γενικά</TabsTrigger><TabsTrigger value="officers">Αξιωματικοί</TabsTrigger><TabsTrigger value="events">Εργασίες</TabsTrigger><TabsTrigger value="pastMasters">Μητρώο</TabsTrigger></TabsList>
      <div className="editor-scroll"><fieldset disabled={saving} style={{border:0,padding:0,margin:0,minWidth:0}}>
        <TabsContent value="general"><div className="editor-group">
          {generalFields.map(([key,label])=><Field key={key} label={label} value={draft[key] as string} type={key==="applicationUrl"?"url":"text"} onChange={v=>set(key,v)}/>)}
          <h3>Εμβλήματα</h3><p className="editor-help">Οι εικόνες σας έχουν ήδη τοποθετηθεί. Μπορείτε να αλλάξετε έναν σύνδεσμο εικόνας.</p>
          <Field label="Έμβλημα ΕΜΣΤΕ" value={draft.grandEmblem} onChange={v=>set("grandEmblem",v)} type="url"/>
          <Field label="Λογότυπο Στοάς" value={draft.lodgeEmblem} onChange={v=>set("lodgeEmblem",v)} type="url"/>
          <Field label="Σφραγίδα Στοάς" value={draft.waxSeal} onChange={v=>set("waxSeal",v)} type="url"/>
        </div></TabsContent>
        <TabsContent value="officers"><div className="editor-group"><p className="editor-help">Κάθε εγγραφή περιλαμβάνει αξίωμα, τίτλο, όνομα και επώνυμο. Προσθέστε τους υπόλοιπους αξιωματικούς και ορίστε τη σειρά τους.</p>
          {draft.officers.map((p,i)=><div key={p.id} className="editor-record">{tools("officers",i,p.role||`Αξιωματικός ${i+1}`)}<Field label="Αξίωμα" value={p.role} onChange={v=>set("officers",draft.officers.map((o,n)=>n===i?{...o,role:v}:o))}/><div className="person-fields">{([['title','Τίτλος'],['firstName','Όνομα'],['lastName','Επώνυμο']] as const).map(([key,label])=><Field key={key} label={label} value={p[key]} onChange={v=>set("officers",draft.officers.map((o,n)=>n===i?{...o,[key]:v}:o))}/>)}</div>{p.id==="secretary"&&<><Field label="Email Γραμματέα" type="email" value={draft.secretaryEmail} onChange={v=>set("secretaryEmail",v)}/><Field label="Κείμενο συνδέσμου email" value={draft.secretaryEmailLabel} onChange={v=>set("secretaryEmailLabel",v)}/></>}</div>)}
          <button className="add-button" disabled={draft.officers.length>=60} onClick={()=>set("officers",[...draft.officers,{id:crypto.randomUUID(),role:"",title:"Αδ.",firstName:"",lastName:""}])}><Plus size={18}/>Προσθήκη αξιωματικού</button>
        </div></TabsContent>
        <TabsContent value="events"><div className="editor-group"><p className="editor-help">Οι εργασίες εμφανίζονται αυτόματα ομαδοποιημένες ανά μήνα, από την πιο πρόσφατη στην παλαιότερη.</p>
          {draft.events.map((event,i)=><div className="editor-record" key={event.id}>{tools("events",i,`Εργασία ${i+1}`)}<Field label="Ημερομηνία" value={event.date} type="date" onChange={v=>set("events",draft.events.map((o,n)=>n===i?{...o,date:v}:o))}/><Field label="Εργασία / τελετή / ομιλία" value={event.title} onChange={v=>set("events",draft.events.map((o,n)=>n===i?{...o,title:v}:o))}/></div>)}
          <button className="add-button" disabled={draft.events.length>=150} onClick={()=>set("events",[...draft.events,{id:crypto.randomUUID(),date:"",title:""}])}><Plus size={18}/>Προσθήκη εργασίας</button>
        </div></TabsContent>
        <TabsContent value="pastMasters"><div className="editor-group"><p className="editor-help">Διορθώστε τα ονόματα, προσθέστε Πρώην Σεβασμίους ή αλλάξτε τη σειρά του μητρώου.</p>
          {draft.pastMasters.map((p,i)=><div className="editor-record" key={p.id}>{tools("pastMasters",i,fullName(p)||`Εγγραφή ${i+1}`)}<div className="person-fields">{([['title','Τίτλος'],['firstName','Όνομα'],['lastName','Επώνυμο']] as const).map(([key,label])=><Field key={key} label={label} value={p[key]} onChange={v=>set("pastMasters",draft.pastMasters.map((o,n)=>n===i?{...o,[key]:v}:o))}/>)}</div></div>)}
          <button className="add-button" disabled={draft.pastMasters.length>=200} onClick={()=>set("pastMasters",[...draft.pastMasters,{id:crypto.randomUUID(),title:"",firstName:"",lastName:""}])}><Plus size={18}/>Προσθήκη Πρώην Σεβασμίου</button>
        </div></TabsContent>
      </fieldset></div>
    </Tabs>
    <div className="editor-actions">
      <p className={`save-status ${saveError?"error":message&&!saving?"success":""}`} role="status" aria-live="polite">{message||(dirty?(restored?"Επαναφέρθηκαν οι μη αποθηκευμένες αλλαγές σας.":"Υπάρχουν αλλαγές προς αποθήκευση."):(updatedAt?`Τελευταία αποθήκευση: ${timestamp(updatedAt)} (ώρα Ελλάδας).`:"Όλα τα στοιχεία είναι έτοιμα για επεξεργασία."))}</p>
      <div className="editor-action-buttons">
        <AlertDialog><AlertDialogTrigger asChild><button className="secondary-button" disabled={!dirty||saving}>Απόρριψη αλλαγών</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Απόρριψη μη αποθηκευμένων αλλαγών;</AlertDialogTitle><AlertDialogDescription>Θα επανέλθουν τα τελευταία αποθηκευμένα στοιχεία.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Επιστροφή</AlertDialogCancel><AlertDialogAction onClick={()=>{setDraft(structuredClone(content));setMessage("");setSaveError(false);setRestored(false);}}>Απόρριψη</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <button className="gold-button" disabled={!dirty||saving||conflict} onClick={save}>{saving?<LoaderCircle className="animate-spin" size={18}/>:dirty?<Save size={18}/>:<Check size={18}/>} {saving?"Αποθήκευση…":"Αποθήκευση αλλαγών"}</button>
      </div>
      {conflict&&<p className="editor-help">Αντιγράψτε τις αλλαγές που θέλετε να κρατήσετε και ανανεώστε τη σελίδα για να φορτώσετε την τελευταία έκδοση.</p>}
    </div>
  </div>;
}
