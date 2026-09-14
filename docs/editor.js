// A second, independent editor for the static GitHub Pages site. It reads
// and writes docs/data/content.json directly through the GitHub REST API,
// using a personal access token the owner pastes in (kept only in this
// browser's localStorage). Saving commits to `main`, which re-triggers the
// Pages deploy workflow so the public page (app.js) picks up the change.
const OWNER = "dskiad", REPO = "NGLG-Themistocles-Lodge-", PATH = "docs/data/content.json", BRANCH = "main";
const TOKEN_KEY = "nglg96-editor-token";
const PASSCODE = "stoa26$";
const UNLOCK_KEY = "nglg96-editor-unlocked";
const app = document.getElementById("app");

let unlocked = sessionStorage.getItem(UNLOCK_KEY) === "1";
let accessDenied = false;
let token = localStorage.getItem(TOKEN_KEY) || "";
let content = null, draft = null, sha = null;
let status = "loading"; // loading | error | ready
let errorMessage = "";
let saving = false;
let saveMessage = "";
let saveError = false;

function esc(s) { return String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function fullName(p) { return [p.title, p.firstName, p.lastName].filter(Boolean).join(" "); }
function utf8ToBase64(str) { const bytes = new TextEncoder().encode(str); let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin); }
function base64ToUtf8(b64) { const bin = atob(b64.replace(/\n/g, "")); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder("utf-8").decode(bytes); }
function dirty() { return JSON.stringify(draft) !== JSON.stringify(content); }

async function apiGet() {
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`, { headers, cache: "no-store" });
  if (!res.ok) { const e = new Error(`GitHub API ${res.status}`); e.status = res.status; throw e; }
  const json = await res.json();
  sha = json.sha;
  return JSON.parse(base64ToUtf8(json.content));
}
async function apiPut(obj, message) {
  if (!token) throw new Error("Χρειάζεται προσωπικό διακριτικό GitHub για αποθήκευση.");
  const body = { message, content: utf8ToBase64(JSON.stringify(obj, null, 2) + "\n"), sha, branch: BRANCH };
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(json.message || `GitHub API ${res.status}`); e.status = res.status; throw e; }
  sha = json.content.sha;
}

async function load() {
  status = "loading"; render();
  try { content = await apiGet(); draft = structuredClone(content); status = "ready"; }
  catch (e) {
    status = "error";
    errorMessage = e.status === 404 ? "Δεν βρέθηκε το αρχείο περιεχομένου."
      : e.status === 401 ? "Μη έγκυρο διακριτικό."
      : e.status === 403 ? "Το όριο αιτημάτων GitHub εξαντλήθηκε για τη σύνδεσή σας. Εισάγετε το προσωπικό διακριτικό σας παρακάτω και πατήστε «Αποθήκευση διακριτικού» (αυτό ξαναφορτώνει με υψηλότερο όριο)."
      : `Δεν ήταν δυνατή η φόρτωση (${e.message}).`;
  }
  render();
}

async function save() {
  saving = true; saveMessage = "Αποθήκευση αλλαγών…"; saveError = false; render();
  try {
    await apiPut(draft, "Ενημέρωση περιεχομένου μέσω του επεξεργαστή");
    content = structuredClone(draft);
    saveMessage = "Οι αλλαγές αποθηκεύτηκαν. Η δημόσια σελίδα θα ενημερωθεί σε περίπου ένα λεπτό (χρόνος αναδημοσίευσης GitHub Pages).";
  } catch (e) {
    saveError = true;
    saveMessage = e.status === 409 ? "Το αρχείο άλλαξε στο μεταξύ. Ανανεώστε τη σελίδα και ξανακάντε τις αλλαγές σας." : `Η αποθήκευση απέτυχε: ${e.message}`;
  }
  saving = false; render();
}

function field(label, value, opts = {}) {
  const { field: f, group, index, key, type = "text", placeholder = "" } = opts;
  const dataAttrs = f ? `data-field="${attr(f)}"` : `data-group="${attr(group)}" data-index="${index}" data-key="${attr(key)}"`;
  return `<label class="editor-field"><span>${esc(label)}</span><input type="${type}" ${dataAttrs} value="${attr(value)}" placeholder="${attr(placeholder)}" maxlength="${type === "url" ? 2000 : 300}"></label>`;
}
function recordHead(label, group, index, canMove) {
  return `<div class="editor-record-head"><span class="editor-record-label">${esc(label)}</span>${canMove ? `<button class="icon-button" type="button" data-action="move" data-dir="-1" data-group="${group}" data-index="${index}" aria-label="Πάνω">↑</button><button class="icon-button" type="button" data-action="move" data-dir="1" data-group="${group}" data-index="${index}" aria-label="Κάτω">↓</button>` : ""}<button class="icon-button" type="button" data-action="remove" data-group="${group}" data-index="${index}" aria-label="Αφαίρεση">✕</button></div>`;
}

const GENERAL_FIELDS = [
  ["grandTitle", "Τίτλος Μεγάλης Στοάς"], ["lodgeType", "Τίτλος Στοάς"], ["lodgeName", "Όνομα Στοάς"], ["lodgeNumber", "Αριθμός Στοάς"],
  ["officersTitle", "Τίτλος ενότητας αξιωματικών"], ["scheduleTitle", "Τίτλος προγράμματος"], ["season", "Περίοδος εργασιών"],
  ["venueIntro", "Κείμενο τόπου εργασιών"], ["venue", "Τόπος εργασιών"], ["pastTitle", "Τίτλος μητρώου"],
  ["applicationTitle", "Κείμενο κουμπιού αίτησης"], ["applicationUrl", "Σύνδεσμος αίτησης νέου μέλους"], ["footer", "Κείμενο υποσέλιδου"],
  ["secretaryEmail", "Email Γραμματέα"], ["secretaryEmailLabel", "Κείμενο συνδέσμου email"], ["marbleCaption", "Λεζάντα μαρμάρινου εμβλήματος"],
];

function tokenPanel() {
  return `<div class="token-panel">
      <div class="token-row">
        <input id="token-input" type="password" placeholder="Προσωπικό διακριτικό GitHub (μόνο για αποθήκευση)" value="${attr(token)}" autocomplete="off">
        <button class="secondary-button" type="button" data-action="save-token">Αποθήκευση διακριτικού</button>
        ${token ? `<button class="secondary-button" type="button" data-action="clear-token">Αποσύνδεση</button>` : ""}
      </div>
      <p class="editor-help">Χρειάζεται μόνο για το κουμπί «Αποθήκευση αλλαγών» παρακάτω, αλλά επιτρέπει και μεγαλύτερο όριο αιτημάτων για την ανάγνωση. Δημιουργήστε ένα fine-grained token στο GitHub, περιορισμένο σε αυτό το repository με δικαίωμα «Contents: Read and write». Αποθηκεύεται μόνο σε αυτόν τον browser.</p>
    </div>`;
}

function render() {
  if (!unlocked) {
    app.innerHTML = `
      <div class="editor-page-head"><h1>Επεξεργασία σελίδας</h1><p>Αυτή η σελίδα απαιτεί κωδικό πρόσβασης.</p></div>
      <div class="token-panel">
        <div class="token-row">
          <input id="passcode-input" type="password" placeholder="Κωδικός πρόσβασης" autocomplete="off">
          <button class="gold-button" type="button" data-action="unlock">Είσοδος</button>
        </div>
        ${accessDenied ? `<p class="save-status error">Δεν έχετε πρόσβαση σε αυτή τη σελίδα.</p>` : ""}
      </div>`;
    const input = document.getElementById("passcode-input");
    input.focus();
    input.addEventListener("keydown", e => { if (e.key === "Enter") document.querySelector('[data-action="unlock"]').click(); });
    return;
  }
  if (status === "loading") { app.innerHTML = `<div class="editor-page-head"><h1>Επεξεργασία σελίδας</h1><p>Φόρτωση περιεχομένου από το GitHub…</p></div>${tokenPanel()}`; return; }
  if (status === "error") {
    app.innerHTML = `<div class="editor-page-head"><h1>Επεξεργασία σελίδας</h1></div>${tokenPanel()}<div class="editor-scroll" style="padding:24px 26px"><p class="save-status error">${esc(errorMessage)}</p><button class="gold-button" type="button" data-action="retry">Δοκιμή ξανά</button></div>`;
    return;
  }
  const isDirty = dirty();
  app.innerHTML = `
    <div class="editor-page-head">
      <h1>Επεξεργασία σελίδας</h1>
      <p>Αλλαγές εδώ αποθηκεύονται απευθείας στο GitHub (<code>${esc(PATH)}</code>) και εμφανίζονται στη <a href="index.html">δημόσια σελίδα</a> μετά την επόμενη αναδημοσίευση.</p>
    </div>
    ${tokenPanel()}
    <div class="editor-scroll" style="padding:24px 26px 32px">
      <div class="editor-group">
        <h3>Γενικά</h3>
        ${GENERAL_FIELDS.map(([k, l]) => field(l, draft[k] ?? "", { field: k, type: k === "applicationUrl" ? "url" : k === "secretaryEmail" ? "email" : "text" })).join("")}
        <h3>Εμβλήματα</h3>
        ${field("Έμβλημα ΕΜΣΤΕ", draft.grandEmblem, { field: "grandEmblem", type: "url" })}
        ${field("Λογότυπο Στοάς", draft.lodgeEmblem, { field: "lodgeEmblem", type: "url" })}
        ${field("Σφραγίδα Στοάς", draft.waxSeal, { field: "waxSeal", type: "url" })}
        <h3>Μαρμάρινες φωτογραφίες</h3>
        ${(draft.marbleImages || []).map((src, i) => `<div class="editor-record">${recordHead(`Φωτογραφία ${i + 1}`, "marbleImages", i, true)}${field("Σύνδεσμος εικόνας", src, { group: "marbleImages", index: i, key: null, type: "url" })}</div>`).join("")}
        <button class="add-button" type="button" data-action="add-marble">+ Προσθήκη μαρμάρινης φωτογραφίας</button>
      </div>
      <div class="editor-group" style="margin-top:30px">
        <h3>Αξιωματικοί</h3>
        ${draft.officers.map((p, i) => `<div class="editor-record">${recordHead(p.role || `Αξιωματικός ${i + 1}`, "officers", i, true)}${field("Αξίωμα", p.role, { group: "officers", index: i, key: "role" })}<div class="person-fields">${field("Τίτλος", p.title, { group: "officers", index: i, key: "title" })}${field("Όνομα", p.firstName, { group: "officers", index: i, key: "firstName" })}${field("Επώνυμο", p.lastName, { group: "officers", index: i, key: "lastName" })}</div></div>`).join("")}
        <button class="add-button" type="button" data-action="add-officer">+ Προσθήκη αξιωματικού</button>
      </div>
      <div class="editor-group" style="margin-top:30px">
        <h3>Εργασίες</h3>
        <p class="editor-help">Εμφανίζονται αυτόματα ομαδοποιημένες ανά μήνα, από την πιο πρόσφατη στην παλαιότερη. Εικόνα και σύνδεσμος είναι προαιρετικά.</p>
        ${draft.events.map((ev, i) => `<div class="editor-record">${recordHead(`Εργασία ${i + 1}`, "events", i, false)}${field("Ημερομηνία", ev.date, { group: "events", index: i, key: "date", type: "date" })}${field("Εργασία / τελετή / ομιλία", ev.title, { group: "events", index: i, key: "title" })}${field("Σύνδεσμος εικόνας (προαιρετικό)", ev.image, { group: "events", index: i, key: "image", type: "url" })}${field("Σύνδεσμος / λινκ (προαιρετικό)", ev.link, { group: "events", index: i, key: "link", type: "url" })}</div>`).join("")}
        <button class="add-button" type="button" data-action="add-event">+ Προσθήκη εργασίας</button>
      </div>
      <div class="editor-group" style="margin-top:30px">
        <h3>Μητρώο Πρώην Σεβασμίων</h3>
        ${draft.pastMasters.map((p, i) => `<div class="editor-record">${recordHead(fullName(p) || `Εγγραφή ${i + 1}`, "pastMasters", i, true)}<div class="person-fields">${field("Τίτλος", p.title, { group: "pastMasters", index: i, key: "title" })}${field("Όνομα", p.firstName, { group: "pastMasters", index: i, key: "firstName" })}${field("Επώνυμο", p.lastName, { group: "pastMasters", index: i, key: "lastName" })}</div></div>`).join("")}
        <button class="add-button" type="button" data-action="add-past">+ Προσθήκη Πρώην Σεβασμίου</button>
      </div>
    </div>
    <div class="editor-actions">
      <p class="save-status ${saveError ? "error" : saveMessage && !saving ? "success" : ""}" role="status" aria-live="polite">${esc(saveMessage || (isDirty ? "Υπάρχουν αλλαγές προς αποθήκευση." : "Δεν υπάρχουν αλλαγές."))}</p>
      <div class="editor-action-buttons">
        <button class="secondary-button" type="button" data-action="discard" ${!isDirty || saving ? "disabled" : ""}>Απόρριψη αλλαγών</button>
        <button class="gold-button" type="button" data-action="save" ${!isDirty || saving ? "disabled" : ""}>${saving ? "Αποθήκευση…" : "Αποθήκευση αλλαγών"}</button>
      </div>
    </div>`;
}

function newOfficer() { return { id: uid(), role: "", title: "Αδ.", firstName: "", lastName: "" }; }
function newEvent() { return { id: uid(), date: "", title: "", image: "", link: "" }; }
function newPast() { return { id: uid(), title: "", firstName: "", lastName: "" }; }

app.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "token-input" || el.id === "passcode-input") return;
  if (el.dataset.field) { draft[el.dataset.field] = el.value; }
  else if (el.dataset.group && el.dataset.index !== undefined) {
    const g = el.dataset.group, i = +el.dataset.index, k = el.dataset.key;
    if (g === "marbleImages") draft.marbleImages[i] = el.value;
    else draft[g][i][k] = el.value;
  }
  const p = app.querySelector(".save-status");
  if (p && !saving) { p.textContent = dirty() ? "Υπάρχουν αλλαγές προς αποθήκευση." : "Δεν υπάρχουν αλλαγές."; p.className = "save-status"; }
  const saveBtn = app.querySelector('[data-action="save"]'), discardBtn = app.querySelector('[data-action="discard"]');
  if (saveBtn) saveBtn.disabled = !dirty();
  if (discardBtn) discardBtn.disabled = !dirty();
});

app.addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "unlock") {
    const value = document.getElementById("passcode-input").value;
    if (value === PASSCODE) { unlocked = true; accessDenied = false; sessionStorage.setItem(UNLOCK_KEY, "1"); return load(); }
    accessDenied = true;
    return render();
  }
  if (action === "retry") return load();
  if (action === "save-token") {
    token = document.getElementById("token-input").value.trim();
    localStorage.setItem(TOKEN_KEY, token);
    return load();
  }
  if (action === "clear-token") { token = ""; localStorage.removeItem(TOKEN_KEY); return render(); }
  if (action === "add-officer") { draft.officers.push(newOfficer()); return render(); }
  if (action === "add-event") { draft.events.push(newEvent()); return render(); }
  if (action === "add-past") { draft.pastMasters.push(newPast()); return render(); }
  if (action === "add-marble") { draft.marbleImages = [...(draft.marbleImages || []), ""]; return render(); }
  if (action === "remove") {
    const g = btn.dataset.group, i = +btn.dataset.index;
    if (g === "officers" && draft.officers.length <= 1) { alert("Χρειάζεται τουλάχιστον ένας αξιωματικός."); return; }
    draft[g].splice(i, 1);
    return render();
  }
  if (action === "move") {
    const g = btn.dataset.group, i = +btn.dataset.index, dir = +btn.dataset.dir, j = i + dir;
    if (j < 0 || j >= draft[g].length) return;
    [draft[g][i], draft[g][j]] = [draft[g][j], draft[g][i]];
    return render();
  }
  if (action === "discard") { if (confirm("Απόρριψη μη αποθηκευμένων αλλαγών;")) { draft = structuredClone(content); return render(); } }
  if (action === "save") {
    const badEvent = draft.events.find(ev => !/^\d{4}-\d{2}-\d{2}$/.test(ev.date) || !ev.title.trim());
    if (badEvent) { alert("Κάθε εργασία χρειάζεται έγκυρη ημερομηνία (ΕΕΕΕ-ΜΜ-ΗΗ) και τίτλο."); return; }
    if (draft.officers.some(p => !p.role.trim() || !p.firstName.trim() || !p.lastName.trim())) { alert("Συμπληρώστε αξίωμα, όνομα και επώνυμο για κάθε αξιωματικό."); return; }
    if (draft.pastMasters.some(p => !p.firstName.trim() || !p.lastName.trim())) { alert("Συμπληρώστε όνομα και επώνυμο για κάθε εγγραφή του μητρώου."); return; }
    if (!token) { alert("Εισάγετε πρώτα το προσωπικό διακριτικό GitHub και πατήστε «Αποθήκευση διακριτικού»."); return; }
    return save();
  }
});

window.addEventListener("beforeunload", e => { if (status === "ready" && dirty()) { e.preventDefault(); e.returnValue = ""; } });

if (unlocked) load(); else render();
