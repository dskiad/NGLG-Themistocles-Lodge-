// Renders the public page from data/content.json. No build step: this file
// is the browser-side equivalent of app/lodge-site.tsx for the static
// GitHub Pages copy of the site.
function esc(s) { return String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
function fullName(p) { return [p.title, p.firstName, p.lastName].filter(Boolean).join(" "); }
function eventParts(value) {
  const d = new Date(value + "T12:00:00Z");
  return {
    day: String(d.getUTCDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat("el-GR", { month: "long", timeZone: "UTC" }).format(d).toLocaleUpperCase("el-GR"),
    year: d.getUTCFullYear(),
    weekday: new Intl.DateTimeFormat("el-GR", { weekday: "long", timeZone: "UTC" }).format(d),
  };
}

function renderMeetings(data) {
  const events = [...data.events].sort((a, b) => b.date.localeCompare(a.date));
  if (!events.length) return `<p class="empty-note">Δεν έχουν προστεθεί ημερομηνίες εργασιών.</p>`;
  const groups = [];
  for (const event of events) {
    const key = event.date.slice(0, 7);
    let group = groups.find(g => g.key === key);
    if (!group) { group = { key, label: `${eventParts(event.date).month} ${eventParts(event.date).year}`, items: [] }; groups.push(group); }
    group.items.push(event);
  }
  let index = 0;
  return groups.map(group => `<div class="month-group"><p class="month-heading">${esc(group.label)}</p>${group.items.map(event => {
    const date = eventParts(event.date);
    const ceremony = /μύηση|τελετή|εγκατάσταση/i.test(event.title);
    index++;
    return `<article class="meeting-row ${ceremony ? "ceremony" : ""}"><time datetime="${attr(event.date)}" class="meeting-date"><span class="date-day">${date.day}</span><span class="date-month">${date.month}<span>${date.year}</span></span></time><span class="meeting-weekday">${date.weekday}</span><div class="meeting-content"><h3>${esc(event.title)}</h3>${event.image ? `<img class="meeting-image" src="${attr(event.image)}" alt="" loading="lazy">` : ""}${event.link ? `<a class="meeting-link" href="${attr(event.link)}" target="_blank" rel="noopener noreferrer">Περισσότερα<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg></a>` : ""}</div><span class="meeting-index" aria-hidden="true">${String(index).padStart(2, "0")}</span></article>`;
  }).join("")}</div>`).join("");
}

function renderPage(data) {
  document.title = `${data.lodgeType} ${data.lodgeName} ${data.lodgeNumber} | ${data.grandTitle}`;
  return `
<a class="skip-link" href="#main">Μετάβαση στο περιεχόμενο</a>
<div class="site-shell">
  <div class="braided-rope braided-rope-left" aria-hidden="true"></div>
  <div class="braided-rope braided-rope-right" aria-hidden="true"></div>
  <header class="grand-header">
    <a href="#main" class="grand-brand"><img src="${attr(data.grandEmblem)}" alt="Έμβλημα της Εθνικής Μεγάλης Στοάς της Ελλάδος" width="65" height="70"><span>${esc(data.grandTitle)}</span></a>
    <a class="editor-button" href="editor.html"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg><span>Επεξεργασία</span></a>
  </header>
  <nav class="main-nav" aria-label="Πλοήγηση σελίδας">
    <a href="#officers">Αξιωματικοί</a><span aria-hidden="true">·</span><a href="#meetings">Εργασίες</a><span aria-hidden="true">·</span><a href="#past-masters">Πρώην Σεβάσμιοι</a>
    <a class="nav-application" href="${attr(data.applicationUrl)}" target="_blank" rel="noopener noreferrer">${esc(data.applicationTitle)}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg></a>
  </nav>
  <main id="main">
    <section class="hero" aria-labelledby="lodge-name">
      <img class="bust-watermark" src="images/themistocles-bust.jpg" alt="" aria-hidden="true" width="650" height="820">
      <div class="hero-frame" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="hero-intro"><span class="hairline"></span>${esc(data.lodgeType)}<span class="hairline"></span></div>
        <h1 id="lodge-name">${esc(data.lodgeName)}</h1>
        <div class="lodge-number">${esc(data.lodgeNumber)}</div>
      </div>
      <div class="lodge-medallion"><div class="medallion-inner"><img src="${attr(data.lodgeEmblem)}" alt="Λογότυπο της ${esc(data.lodgeType)} ${esc(data.lodgeName)} ${esc(data.lodgeNumber)}" width="300" height="300"></div></div>
      <a class="hero-venue" href="#meetings"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>${esc(data.venue)}</a>
      <div class="hero-baseline" aria-hidden="true"><span>${esc(data.lodgeName)}</span><span>ΠΕΙΡΑΙΕΥΣ</span></div>
    </section>

    <section class="marble-banner" aria-labelledby="marble-caption">
      <div class="marble-row">${(data.marbleImages || []).map(src => `<img src="${attr(src)}" alt="${attr(data.marbleCaption || "")}" width="1141" height="928" loading="lazy">`).join("")}</div>
      <p id="marble-caption" class="marble-caption">${esc(data.marbleCaption)}</p>
    </section>

    <section id="officers" class="officers-section section-wrap" aria-labelledby="officers-heading">
      <div class="section-kicker"><span class="little-diamond"></span>${esc(data.officersTitle)}</div>
      <h2 id="officers-heading" class="sr-only">${esc(data.officersTitle)}</h2>
      <div class="officer-grid">${data.officers.map((p, i) => `<article class="officer"><span class="officer-mark" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><p class="officer-role">${esc(p.role)}</p><h3>${esc(fullName(p))}</h3>${p.id === "secretary" ? `<a class="secretary-contact" href="mailto:${attr(data.secretaryEmail)}"><span>${esc(data.secretaryEmailLabel)}</span><span>${esc(data.secretaryEmail)}</span></a>` : ""}</div></article>`).join("")}</div>
    </section>

    <section id="meetings" class="meetings-section" aria-labelledby="meetings-heading">
      <div class="section-wrap">
        <div class="section-heading"><div><span class="section-kicker dark-kicker">${esc(data.season)}</span><h2 id="meetings-heading">${esc(data.scheduleTitle)}</h2></div><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg></div>
        <p class="venue-line"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg><span>${esc(data.venueIntro)} <strong>${esc(data.venue)}</strong></span></p>
        <div class="schedule-list">${renderMeetings(data)}</div>
      </div>
    </section>

    <section id="past-masters" class="past-section section-wrap" aria-labelledby="past-heading">
      <img class="registry-seal" src="images/wax-seal-nglg.png" alt="" aria-hidden="true" width="1024" height="1536">
      <div class="section-heading"><div><span class="section-kicker"><span class="little-diamond"></span>${esc(data.lodgeName)} · ${esc(data.lodgeNumber)}</span><h2 id="past-heading">${esc(data.pastTitle)}</h2></div><svg width="33" height="33" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9.5 12l1.8 1.8L15 10.2"/></svg></div>
      <div class="past-grid">${data.pastMasters.length ? data.pastMasters.map((p, i) => `<div class="past-person"><span aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><p>${esc(fullName(p))}</p></div>`).join("") : `<p class="empty-note">Δεν έχουν προστεθεί ονόματα στο μητρώο.</p>`}</div>
    </section>

    <section class="application-section section-wrap" aria-labelledby="application-heading">
      <div class="application-panel"><img class="wax-seal" src="${attr(data.waxSeal)}" alt="Σφραγίδα της ${esc(data.lodgeName)} ${esc(data.lodgeNumber)}" width="150" height="220"><div><span class="section-kicker">${esc(data.lodgeType)} ${esc(data.lodgeName)}</span><h2 id="application-heading">${esc(data.applicationTitle)}</h2></div><a class="gold-button" href="${attr(data.applicationUrl)}" target="_blank" rel="noopener noreferrer">${esc(data.applicationTitle)}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg></a></div>
    </section>
  </main>
  <footer class="site-footer">
    <div class="footer-rule" aria-hidden="true"><span></span>✧<span></span></div>
    <p class="footer-lodge">${esc(data.lodgeType)} ${esc(data.lodgeName)} ${esc(data.lodgeNumber)}</p>
    <p>${esc(data.grandTitle)}</p>
    <small class="image-credit">Προτομή Θεμιστοκλή: <a href="https://commons.wikimedia.org/wiki/File:Busto_di_temistocle,_da_originale_greco_del_V_secolo_ac,_dal_decumano_presso_il_casamento_del_temistocle.JPG" target="_blank" rel="noopener noreferrer">Sailko / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a> · Χρωματική απόδοση ως υδατογράφημα.</small>
    <div class="footer-credit">${esc(data.footer)}</div>
  </footer>
</div>
<p class="static-note">Στατικό στιγμιότυπο της σελίδας, αποδιδόμενο από το <code>data/content.json</code>. <a href="editor.html">Επεξεργασία περιεχομένου</a> · Πηγαίος κώδικας: <a href="https://github.com/dskiad/NGLG-Themistocles-Lodge-" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>`;
}

fetch("data/content.json", { cache: "no-store" })
  .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
  .then(data => { document.getElementById("app").innerHTML = renderPage(data); })
  .catch(err => {
    document.getElementById("app").innerHTML = `<div class="load-error" role="alert">Δεν ήταν δυνατή η φόρτωση του περιεχομένου (${esc(err.message)}). <a href="data/content.json">Δοκιμή απευθείας</a></div>`;
  });
