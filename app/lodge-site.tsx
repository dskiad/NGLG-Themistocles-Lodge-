"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Pencil, ShieldCheck, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { LodgeContent, fullName, eventParts, contentResponseSchema } from "@/lib/content";
import Editor from "./site-editor";
import { useSiteTools } from "@/lib/use-site-tools";

export default function LodgeSite({initialContent}: {initialContent:LodgeContent}) {
  const [content,setContent] = useState(initialContent);
  const [revision,setRevision] = useState(0);
  const [updatedAt,setUpdatedAt] = useState<string|null>(null);
  const [canEdit,setCanEdit] = useState(false);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState("");
  const [open,setOpen] = useState(false);
  useSiteTools(content,canEdit,()=>setOpen(true));
  async function loadContent() {
    try {
      const r = await fetch("/api/content", {cache:"no-store"});
      if(!r.ok) throw new Error();
      const data = contentResponseSchema.parse(await r.json());
      setContent(data.content); setRevision(data.revision); setUpdatedAt(data.updatedAt); setCanEdit(data.canEdit); setLoaded(true); setError("");
    } catch {setError("Δεν ήταν δυνατή η φόρτωση των τελευταίων αλλαγών.");}
  }
  useEffect(() => {loadContent();},[]);
  useEffect(() => {document.title = `${content.lodgeType} ${content.lodgeName} ${content.lodgeNumber} | ${content.grandTitle}`;},[content.lodgeType,content.lodgeName,content.lodgeNumber,content.grandTitle]);
  const events = [...content.events].sort((a,b)=>b.date.localeCompare(a.date));
  const eventGroups: {key:string; label:string; items:typeof events}[] = [];
  for (const event of events) {
    const key = event.date.slice(0,7);
    const group = eventGroups.find(g=>g.key===key);
    if (group) group.items.push(event);
    else eventGroups.push({key, label:`${eventParts(event.date).month} ${eventParts(event.date).year}`, items:[event]});
  }
  let eventIndex = 0;
  return <>
    <a className="skip-link" href="#main">Μετάβαση στο περιεχόμενο</a>
    <div className="site-shell">
      <div className="braided-rope braided-rope-left" aria-hidden="true"/>
      <div className="braided-rope braided-rope-right" aria-hidden="true"/>
      <header className="grand-header">
        <a href="#main" className="grand-brand"><img src={content.grandEmblem} alt="Έμβλημα της Εθνικής Μεγάλης Στοάς της Ελλάδος" width="65" height="70"/><span>{content.grandTitle}</span></a>
        <button className="editor-button" aria-label="Επεξεργασία σελίδας" onClick={()=>setOpen(true)} disabled={!loaded && !error}><Pencil size={18}/><span>Επεξεργασία</span></button>
      </header>
      <nav className="main-nav" aria-label="Πλοήγηση σελίδας">
        <a href="#officers">Αξιωματικοί</a><span aria-hidden="true">·</span><a href="#meetings">Εργασίες</a><span aria-hidden="true">·</span><a href="#past-masters">Πρώην Σεβάσμιοι</a><a className="nav-application" href={content.applicationUrl} target="_blank" rel="noopener noreferrer">{content.applicationTitle}<ArrowUpRight size={15}/></a>
      </nav>
      {error && <div className="load-error" role="alert">{error} <button onClick={loadContent}>Δοκιμή ξανά</button></div>}
      <main id="main">
        <section className="hero" aria-labelledby="lodge-name">
          <img className="bust-watermark" src="/images/themistocles-bust.jpg" alt="" aria-hidden="true" width="650" height="820"/>
          <div className="hero-frame" aria-hidden="true"/>
          <div className="hero-content">
            <div className="hero-intro"><span className="hairline"/>{content.lodgeType}<span className="hairline"/></div>
            <h1 id="lodge-name">{content.lodgeName}</h1>
            <div className="lodge-number">{content.lodgeNumber}</div>
          </div>
          <div className="lodge-medallion"><div className="medallion-inner"><img src={content.lodgeEmblem} alt="Λογότυπο της Συμβολικής Στοάς Θεμιστοκλής υπ’ αριθμ. 96" width="300" height="300" decoding="async" fetchPriority="high"/></div></div>
          <a className="hero-venue" href="#meetings"><MapPin size={17}/>{content.venue}</a>
          <div className="hero-baseline" aria-hidden="true"><span>{content.lodgeName}</span><span>ΠΕΙΡΑΙΕΥΣ</span></div>
        </section>

        <section className="marble-banner" aria-labelledby="marble-caption">
          <img src="/images/marble-emblem.png" alt="Το έμβλημα της Στοάς Θεμιστοκλής σκαλισμένο σε μάρμαρο" width="1141" height="928" loading="lazy"/>
          <p id="marble-caption" className="marble-caption">Το έμβλημα της Στοάς, αποτυπωμένο σε μάρμαρο</p>
        </section>

        <section id="officers" className="officers-section section-wrap" aria-labelledby="officers-heading">
          <div className="section-kicker"><span className="little-diamond"/>{content.officersTitle}</div>
          <h2 id="officers-heading" className="sr-only">{content.officersTitle}</h2>
          <div className="officer-grid">{content.officers.map((person,i)=><article className="officer" key={person.id}><span className="officer-mark" aria-hidden="true">{String(i+1).padStart(2,"0")}</span><div><p className="officer-role">{person.role}</p><h3>{fullName(person)}</h3>{person.id==="secretary"&&<a className="secretary-contact" href={`mailto:${content.secretaryEmail}`}><span>{content.secretaryEmailLabel}</span><span>{content.secretaryEmail}</span></a>}</div></article>)}</div>
        </section>

        <section id="meetings" className="meetings-section" aria-labelledby="meetings-heading">
          <div className="section-wrap">
            <div className="section-heading"><div><span className="section-kicker dark-kicker">{content.season}</span><h2 id="meetings-heading">{content.scheduleTitle}</h2></div><CalendarDays size={36} strokeWidth={1}/></div>
            <p className="venue-line"><MapPin size={17}/><span>{content.venueIntro} <strong>{content.venue}</strong></span></p>
            <div className="schedule-list">{events.length ? eventGroups.map(group=><div className="month-group" key={group.key}><p className="month-heading">{group.label}</p>{group.items.map(event=>{const date=eventParts(event.date); const ceremony=/μύηση/i.test(event.title); eventIndex++; return <article className={`meeting-row ${ceremony?"ceremony":""}`} key={event.id}><time dateTime={event.date} className="meeting-date"><span className="date-day">{date.day}</span><span className="date-month">{date.month}<span>{date.year}</span></span></time><span className="meeting-weekday">{date.weekday}</span><div className="meeting-content"><h3>{event.title}</h3>{event.image&&<img className="meeting-image" src={event.image} alt="" loading="lazy"/>}{event.link&&<a className="meeting-link" href={event.link} target="_blank" rel="noopener noreferrer">Περισσότερα<ArrowUpRight size={14}/></a>}</div><span className="meeting-index" aria-hidden="true">{String(eventIndex).padStart(2,"0")}</span></article>})}</div>) : <p className="empty-note">Δεν έχουν προστεθεί ημερομηνίες εργασιών.</p>}</div>
          </div>
        </section>

        <section id="past-masters" className="past-section section-wrap" aria-labelledby="past-heading">
          <img className="registry-seal" src="/images/wax-seal-nglg.png" alt="" aria-hidden="true" width="1024" height="1536"/>
          <div className="section-heading"><div><span className="section-kicker"><span className="little-diamond"/>{content.lodgeName} · {content.lodgeNumber}</span><h2 id="past-heading">{content.pastTitle}</h2></div><ShieldCheck size={33} strokeWidth={1}/></div>
          <div className="past-grid">{content.pastMasters.map((person,i)=><div className="past-person" key={person.id}><span aria-hidden="true">{String(i+1).padStart(2,"0")}</span><p>{fullName(person)}</p></div>)}</div>
          {!content.pastMasters.length&&<p className="empty-note">Δεν έχουν προστεθεί ονόματα στο μητρώο.</p>}
        </section>

        <section className="application-section section-wrap" aria-labelledby="application-heading">
          <div className="application-panel"><img className="wax-seal" src={content.waxSeal} alt="Σφραγίδα της Στοάς Θεμιστοκλής 96" width="150" height="220"/><div><span className="section-kicker">{content.lodgeType} {content.lodgeName}</span><h2 id="application-heading">{content.applicationTitle}</h2></div><a className="gold-button" href={content.applicationUrl} target="_blank" rel="noopener noreferrer">{content.applicationTitle}<ArrowUpRight size={20}/></a></div>
        </section>
      </main>
      <footer className="site-footer"><div className="footer-rule" aria-hidden="true"><span/>✧<span/></div><p className="footer-lodge">{content.lodgeType} {content.lodgeName} {content.lodgeNumber}</p><p>{content.grandTitle}</p><small className="image-credit">Προτομή Θεμιστοκλή: <a href="https://commons.wikimedia.org/wiki/File:Busto_di_temistocle,_da_originale_greco_del_V_secolo_ac,_dal_decumano_presso_il_casamento_del_temistocle.JPG" target="_blank" rel="noopener noreferrer">Sailko / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a> · Χρωματική απόδοση ως υδατογράφημα.</small><div className="footer-credit">{content.footer}</div></footer>
    </div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="editor-sheet" showCloseButton={false}><header className="editor-head"><div><SheetTitle>Επεξεργασία σελίδας</SheetTitle><SheetDescription>Διορθώστε τα στοιχεία και αποθηκεύστε τις αλλαγές.</SheetDescription></div><button className="icon-button" aria-label="Κλείσιμο επεξεργασίας" onClick={()=>setOpen(false)}><X size={22}/></button></header>{loaded&&canEdit ? <Editor content={content} revision={revision} updatedAt={updatedAt} onSaved={(c,r,t)=>{setContent(c);setRevision(r);setUpdatedAt(t);}}/> : <div className="editor-access">{error?<><p>{error}</p><button className="gold-button" onClick={loadContent}>Δοκιμή ξανά</button></>:<><p>Συνδεθείτε με τον λογαριασμό διαχείρισης για να επεξεργαστείτε τη σελίδα.</p><a className="gold-button" href="/signin-with-chatgpt?return_to=%2F" target="_top">Σύνδεση με ChatGPT</a></>}</div>}</SheetContent></Sheet>
    <Toaster position="bottom-center" richColors/>
  </>;
}
