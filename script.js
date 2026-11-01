const ADMIN_PASS = "admin123"; // CHANGE THIS before you use the site
const KEY = "minshop-v3";
const drivers = ["Unassigned", "Abel", "Hana", "Samuel", "Meron"];
const flow = ["Pending", "On the way", "Delivered"];
let admin = false, user = null, mode = "login", editing = null, orderFor = null;

let S = {
  home: { title: "Welcome to MinShop", text: "Building materials and home supplies, delivered to your door.\nChoose a material below and order in a minute." },
  about: { title: "About our shop", text: "MinShop sells quality materials at fair prices.\nTell your customers who you are and how to reach you." },
  contact: { phone: "+251 ", email: "", address: "Deder, Oromia", hours: "Mon to Sat, 8:00 to 18:00" },
  video: "", gallery: [], users: [], orders: [], log: [],
  products: [
    { id: 1, name: "Cement (50 kg)", price: 900, desc: "Portland cement for general building.", img: "" },
    { id: 2, name: "Roofing sheet", price: 650, desc: "Galvanized corrugated sheet.", img: "" },
    { id: 3, name: "Paint (20 L)", price: 3200, desc: "Interior wall paint.", img: "" }
  ]
};
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) S = { ...S, ...s }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Storage is full. Remove some photos."); } };
const $ = (id) => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
const btn = (x, c, f) => { const b = el("button", c, x); b.onclick = f; return b; };
function toast(m) { const t = $("toast"); t.textContent = m; t.hidden = false; setTimeout(() => t.hidden = true, 2500); }

function resize(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const k = Math.min(1, 640 / im.width), c = document.createElement("canvas");
      c.width = im.width * k; c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .75));
    }; im.src = r.result; };
    r.readAsDataURL(file);
  });
}

/* ---------- login gate ---------- */
function setMode(m) {
  mode = m;
  ["login", "register", "admin"].forEach(x => $("tab-" + x).classList.toggle("on", x === m));
  $("gName").parentElement.hidden = m !== "register";
  $("gPhone").parentElement.hidden = m === "admin";
  $("gName").required = m === "register"; $("gPhone").required = m !== "admin"; $("gErr").hidden = true;
}
["login", "register", "admin"].forEach(m => $("tab-" + m).onclick = () => setMode(m));
const gErr = (m) => { $("gErr").textContent = m; $("gErr").hidden = false; };
$("gateForm").onsubmit = (e) => {
  e.preventDefault();
  const phone = $("gPhone").value.trim(), pass = $("gPass").value;
  if (mode === "admin") return pass === ADMIN_PASS ? enter({ name: "Admin" }, true) : gErr("Wrong admin password.");
  if (mode === "register") {
    if (S.users.some(u => u.phone === phone)) return gErr("This phone number already has an account. Use Log in.");
    const u = { name: $("gName").value.trim(), phone, pass }; S.users.push(u); save(); return enter(u, false);
  }
  const u = S.users.find(u => u.phone === phone && u.pass === pass);
  u ? enter(u, false) : gErr("Phone number or password is wrong.");
};
function enter(u, isAdmin) {
  user = u; admin = isAdmin;
  try { sessionStorage.setItem("minshop-session", JSON.stringify({ phone: u.phone || "", admin: isAdmin })); } catch (e) {}
  $("gate").hidden = true; $("site").hidden = false; $("hello").textContent = "Hi, " + u.name;
  renderAll(); show("home");
}
$("logout").onclick = () => {
  try { sessionStorage.removeItem("minshop-session"); } catch (e) {}
  admin = false; user = null; $("gateForm").reset(); setMode("login"); $("site").hidden = true; $("gate").hidden = false;
};

/* ---------- pages ---------- */
const block = (title, extra) => { const b = el("div", "block"), h = el("div", "head"); h.append(el("h2", "", title)); if (extra) h.append(extra); b.append(h); return b; };

function textPage(key, big) {
  const s = $(key); s.innerHTML = "";
  const box = el("div", big ? "hero" : "");
  box.append(el("h2", "", S[key].title), el("p", "lead", S[key].text));
  if (admin) box.append(btn("Edit this page", "btn", () => { editing = key; $("tTitle").value = S[key].title; $("tText").value = S[key].text; $("textDlg").showModal(); }));
  s.append(box);
}

function videoEl(u) {
  const y = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if (y) { const f = el("iframe", "video"); f.src = "https://www.youtube.com/embed/" + y[1]; f.title = "MinShop video"; f.allowFullscreen = true; return f; }
  const v = el("video", "video"); v.src = u; v.controls = true; return v;
}

function renderHome() {
  textPage("home", true);
  const s = $("home");
  let b = block("Materials");
  if (!S.products.length) b.append(el("p", "empty", "No materials listed yet."));
  const ch = el("div", "chips");
  S.products.forEach(p => { const c = el("button", "chip"); c.append(el("b", "", p.name), el("span", "", p.price + " ETB")); c.onclick = () => show("shop"); ch.append(c); });
  b.append(ch); s.append(b);

  b = block("Photos", S.gallery.length ? btn("See all photos", "mini", () => show("gallery")) : null);
  if (!S.gallery.length) b.append(el("p", "empty", admin ? "Add photos in the Gallery tab and they appear here." : "Photos are coming soon."));
  const g = el("div", "grid");
  S.gallery.slice(0, 4).forEach((src, n) => { const d = el("div", "item"), im = el("img"); im.src = src; im.alt = "Shop photo " + (n + 1); d.append(im); g.append(d); });
  b.append(g); s.append(b);

  b = block("Video", admin ? btn(S.video ? "Change video" : "Add video", "mini", () => { $("vUrl").value = S.video; $("videoDlg").showModal(); }) : null);
  if (S.video) b.append(videoEl(S.video)); else b.append(el("p", "empty", admin ? "No video yet. Select Add video." : "A video is coming soon."));
  s.append(b);

  const c = S.contact;
  b = block("Contact us", admin ? btn("Edit contact", "mini", () => { $("cPhone").value = c.phone; $("cEmail").value = c.email; $("cAddr").value = c.address; $("cHours").value = c.hours; $("contactDlg").showModal(); }) : null);
  const d = el("div", "contact");
  [["Phone", c.phone], ["Email", c.email], ["Address", c.address], ["Hours", c.hours]].forEach(([k, v]) => { if (v && v.trim()) d.append(el("div", "", k + ": " + v)); });
  b.append(d); s.append(b);
}

function renderGallery() {
  const s = $("gallery"); s.innerHTML = "";
  const h = el("div", "head"); h.append(el("h2", "", "Gallery"));
  if (admin) { const l = el("label", "btn", "Add photos"), i = el("input"); i.type = "file"; i.accept = "image/*"; i.multiple = true; i.hidden = true;
    i.onchange = async () => { for (const f of i.files) S.gallery.push(await resize(f)); save(); renderGallery(); renderHome(); };
    l.append(i); l.style.margin = 0; h.append(l); }
  s.append(h);
  if (!S.gallery.length) s.append(el("p", "empty", admin ? "No photos yet. Select Add photos." : "Photos are coming soon."));
  const g = el("div", "grid");
  S.gallery.forEach((src, n) => {
    const d = el("div", "item"), im = el("img"); im.src = src; im.alt = "Shop photo " + (n + 1); d.append(im);
    if (admin) { const b = el("div", "body"); b.append(btn("Remove", "mini del", () => { S.gallery.splice(n, 1); save(); renderGallery(); renderHome(); })); d.append(b); }
    g.append(d);
  });
  s.append(g);
}

function renderShop() {
  const s = $("shop"); s.innerHTML = "";
  const h = el("div", "head"); h.append(el("h2", "", "Shop: materials"));
  if (admin) h.append(btn("Add material", "btn", () => { $("prodForm").reset(); $("prodDlg").showModal(); }));
  s.append(h);
  if (!S.products.length) s.append(el("p", "empty", "No materials listed yet."));
  const g = el("div", "grid");
  S.products.forEach((p) => {
    const d = el("div", "item");
    if (p.img) { const im = el("img"); im.src = p.img; im.alt = p.name; d.append(im); } else d.append(el("div", "ph", p.name[0]));
    const b = el("div", "body"); b.append(el("h3", "", p.name), el("p", "", p.desc), el("div", "price", p.price + " ETB"));
    const r = el("div", "row");
    r.append(btn("Order", "btn", () => { orderFor = p; $("orderTitle").textContent = "Order: " + p.name; $("orderForm").reset(); $("orderDlg").showModal(); }));
    if (admin) r.append(btn("Remove", "mini del", () => { S.products = S.products.filter(x => x.id !== p.id); save(); renderShop(); renderHome(); }));
    b.append(r); d.append(b); g.append(d);
  });
  s.append(g);
}

/* ---------- analytics ---------- */
function analytics() {
  const w = el("div", "panel"), day = (t) => new Date(t).toDateString();
  const sum = (type, f) => S.log.filter(l => l.type === type && f(l)).reduce((a, l) => a + l.qty, 0);
  const today = new Date().toDateString();
  w.append(el("h3", "", "Today: sold " + sum("sale", l => day(l.t) === today) + " units, bought " + sum("buy", l => day(l.t) === today) + " units"));
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
  const rows = days.map(d => ({ n: d.toLocaleDateString(undefined, { weekday: "short" }), s: sum("sale", l => day(l.t) === d.toDateString()), b: sum("buy", l => day(l.t) === d.toDateString()) }));
  const max = Math.max(1, ...rows.map(r => Math.max(r.s, r.b)));
  const lg = el("div", "legend"); lg.innerHTML = "Last 7 days<b class='sold'></b>Sold<b class='bought'></b>Bought"; w.append(lg);
  rows.forEach(r => {
    const row = el("div", "bar"); row.append(el("span", "", r.n));
    const c = el("div"), a = el("i", "sold"), b = el("i", "bought");
    a.style.width = (r.s / max * 100) + "%"; b.style.width = (r.b / max * 100) + "%"; a.title = r.s + " sold"; b.title = r.b + " bought";
    c.append(a, b, el("small", "", " " + r.s + " / " + r.b)); row.append(c); w.append(row);
  });
  return w;
}
function byTime() {
  const w = el("div", "panel"); w.append(el("h3", "", "Sales by time of day"));
  const parts = { "Morning (5 to 12)": 0, "Afternoon (12 to 17)": 0, "Evening (17 to 21)": 0, "Night (21 to 5)": 0 }, keys = Object.keys(parts), items = {};
  S.log.filter(l => l.type === "sale").forEach(l => {
    const h = new Date(l.t).getHours(); parts[keys[h >= 5 && h < 12 ? 0 : h < 17 && h >= 12 ? 1 : h >= 17 && h < 21 ? 2 : 3]] += l.qty;
    items[l.item] = (items[l.item] || 0) + l.qty;
  });
  keys.forEach(k => w.append(el("div", "", k + ": " + parts[k] + " units")));
  w.append(el("h3", "", "Sold by material"));
  const e = Object.entries(items); if (!e.length) w.append(el("p", "empty", "No sales yet."));
  e.sort((a, b) => b[1] - a[1]).forEach(([k, v]) => w.append(el("div", "", k + ": " + v + " units")));
  return w;
}

function renderDash() {
  const s = $("dashboard"); s.innerHTML = "";
  if (!admin) return;
  const h = el("div", "head"); h.append(el("h2", "", "Deliveries and sales"));
  h.append(btn("Record stock purchase", "btn", () => { $("bItem").innerHTML = ""; S.products.forEach(p => $("bItem").append(el("option", "", p.name))); $("buyDlg").showModal(); }));
  s.append(h);
  const c = (st) => S.orders.filter(o => o.status === st).length;
  const st = el("div", "stats");
  [["Total orders", S.orders.length], ["Pending", c("Pending")], ["On the way", c("On the way")], ["Delivered", c("Delivered")]]
    .forEach(([l, n]) => { const d = el("div", "stat"); d.append(el("b", "", n), el("span", "", l)); st.append(d); });
  s.append(st);
  const two = el("div", "two"); two.append(analytics(), byTime()); s.append(two);
  const p = el("div", "panel");
  if (!S.orders.length) p.append(el("p", "empty", "No orders yet. Orders from the Shop appear here."));
  else {
    const sc = el("div", "scroll"), t = el("table"), th = el("thead");
    th.innerHTML = "<tr><th>Order</th><th>Item</th><th>Customer</th><th>Address</th><th>Driver</th><th>Status</th><th></th></tr>"; t.append(th);
    const tb = el("tbody");
    S.orders.forEach((o) => {
      const tr = el("tr");
      ["#" + o.id, o.item + " x " + o.qty, o.customer + " (" + o.phone + ")", o.address].forEach(v => tr.append(el("td", "", v)));
      const dd = el("td"), sel = el("select"); drivers.forEach(n => { const op = el("option", "", n); if (n === o.driver) op.selected = true; sel.append(op); });
      sel.onchange = () => { o.driver = sel.value; save(); }; dd.append(sel); tr.append(dd);
      const sd = el("td"); sd.append(el("span", "tag " + o.status, o.status)); tr.append(sd);
      const ad = el("td"), nx = flow[flow.indexOf(o.status) + 1];
      if (nx) ad.append(btn("Mark " + nx.toLowerCase(), "mini", () => { o.status = nx; save(); renderDash(); }), " ");
      ad.append(btn("Remove", "mini del", () => { S.orders = S.orders.filter(x => x !== o); save(); renderDash(); }));
      tr.append(ad); tb.append(tr);
    });
    t.append(tb); sc.append(t); p.append(sc);
  }
  s.append(p);
}

function renderAll() {
  renderHome(); textPage("about", false); renderGallery(); renderShop(); renderDash();
  $("adminBar").hidden = !admin; $("dashTab").hidden = !admin;
}
function show(p) {
  if (p === "dashboard" && !admin) p = "home";
  document.querySelectorAll(".page").forEach(s => s.hidden = s.id !== p);
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.p === p));
  window.scrollTo(0, 0);
}

/* ---------- events ---------- */
$("nav").onclick = (e) => { if (e.target.dataset.p) show(e.target.dataset.p); };
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());
$("textForm").addEventListener("submit", () => {
  if (editing === "about") S.about = { title: $("tTitle").value, text: $("tText").value }; else S.home = { title: $("tTitle").value, text: $("tText").value };
  save(); renderAll(); toast("Saved");
});
$("prodForm").addEventListener("submit", async () => {
  const f = $("pImg").files[0];
  S.products.push({ id: Date.now(), name: $("pName").value, price: $("pPrice").value, desc: $("pDesc").value, img: f ? await resize(f) : "" });
  save(); renderShop(); renderHome(); toast("Material added");
});
$("contactForm").addEventListener("submit", () => { S.contact = { phone: $("cPhone").value, email: $("cEmail").value, address: $("cAddr").value, hours: $("cHours").value }; save(); renderHome(); toast("Contact saved"); });
$("videoForm").addEventListener("submit", () => { S.video = $("vUrl").value.trim(); save(); renderHome(); toast("Video saved"); });
$("orderForm").addEventListener("submit", () => {
  const id = S.orders.reduce((m, o) => Math.max(m, o.id), 1000) + 1, qty = Math.max(1, +$("oQty").value || 1);
  S.orders.unshift({ id, item: orderFor.name, qty, customer: user.name, phone: user.phone || "", address: $("oAddr").value, driver: "Unassigned", status: "Pending" });
  S.log.push({ type: "sale", item: orderFor.name, qty, t: Date.now() });
  save(); renderDash(); toast("Order sent. We will deliver soon.");
});
$("buyForm").addEventListener("submit", () => {
  S.log.push({ type: "buy", item: $("bItem").value, qty: Math.max(1, +$("bQty").value || 1), t: Date.now() });
  save(); renderDash(); toast("Purchase recorded");
});

try {
  const ss = JSON.parse(sessionStorage.getItem("minshop-session"));
  if (ss) { if (ss.admin) enter({ name: "Admin" }, true); else { const u = S.users.find(u => u.phone === ss.phone); if (u) enter(u, false); } }
} catch (e) {}
setMode("login");
