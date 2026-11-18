(() => {
  const storageKey = "campus-stores.shift.v3";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      // Isha named Kabir in the desk book (Friday 3:20 pm).
      collectors: ["Isha Rao", "Kabir Sen"],
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      collectors: ["Tara Shah"],
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      collectors: ["Dev Menon"],
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];

  // Times are typed like "Sat 9 am", "Sat 11:30 am" or "Sat noon".
  // They become minutes from Friday midnight so the desk can compare them.
  const days = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
  const suggestedTimes = ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"];
  function toMin(text) {
    const m = String(text || "")
      .trim()
      .toLowerCase()
      .match(
        /^(fri|sat|sun|mon|tue|wed|thu)[a-z]*\.?,?\s+(?:(noon)|(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm))$/,
      );
    if (!m) return null;
    const day = days.findIndex((d) => d.toLowerCase() === m[1]);
    if (m[2]) return day * 1440 + 720;
    const h = Number(m[3]),
      mm = Number(m[4] || 0);
    if (h < 1 || h > 12 || mm > 59) return null;
    return day * 1440 + ((h % 12) + (m[5] === "pm" ? 12 : 0)) * 60 + mm;
  }
  function fmtMin(min) {
    const day = days[Math.floor(min / 1440)],
      r = min % 1440;
    if (r === 720) return day + " noon";
    const h = Math.floor(r / 60),
      mm = r % 60;
    return (
      day +
      " " +
      (h % 12 || 12) +
      (mm ? ":" + String(mm).padStart(2, "0") : "") +
      (h >= 12 ? " pm" : " am")
    );
  }
  const tidyTime = (text) => {
    const min = toMin(text);
    return min === null ? null : fmtMin(min);
  };

  const shifts = [
    {
      time: "Friday · 3:45 pm",
      now: toMin("Fri 3:45 pm"),
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      now: toMin("Fri 7:30 pm"),
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      now: toMin("Sat 9 am"),
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 3,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        holder: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    draft: {},
    checking: 0,
    following: 0,
    onlyOpen: true,
    undo: null,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  // Undo sits in the status bar, beside the message about the last check-in.
  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.dataset.action = "undo";
  undoBtn.textContent = "Undo";
  undoBtn.hidden = true;
  q(".statusbar").insertBefore(undoBtn, q('[data-action="restart"]'));
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const getLoan = (num) => s.loans.find((l) => l.num === Number(num));
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const holderOf = (l) => l.holder || l.who;
  const typeOf = (l) => getAsset(l.asset).type;
  const slipsOf = (r, type) =>
    s.loans.filter((l) => l.req === r.id && typeOf(l) === type);
  const openFor = (r) => s.loans.filter((l) => l.req === r.id && !l.back);
  const count = (list, x) => list.filter((y) => y === x).length;
  // Approved items not issued yet, one entry per unit still to go out.
  const remaining = (r) =>
    [...new Set(r.items)].flatMap((t) =>
      Array(Math.max(0, count(r.items, t) - slipsOf(r, t).length)).fill(t),
    );
  // What may go out now: approved quantity minus units currently out.
  // A unit taken back by mistake can be swapped for the right one.
  const issuable = (r) =>
    [...new Set(r.items)].flatMap((t) =>
      Array(
        Math.max(
          0,
          count(r.items, t) - slipsOf(r, t).filter((l) => !l.back).length,
        ),
      ).fill(t),
    );
  // Everyone the desk has dealt with, for name suggestions.
  const knownPeople = () => [
    ...new Set([
      ...people,
      ...requests.flatMap((r) => r.collectors),
      ...s.loans.flatMap((l) => [l.who, l.holder, l.toldBy]).filter(Boolean),
    ]),
  ];
  // Match a typed name to a known one, ignoring case; otherwise tidy it up.
  function tidyName(text) {
    const t = String(text || "").trim().replace(/\s+/g, " ");
    if (!t) return "";
    const known = knownPeople().find((p) => p.toLowerCase() === t.toLowerCase());
    return known || t.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  }
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list, sel = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === sel ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const datalist = (id, values) =>
    '<datalist id="' +
    id +
    '">' +
    values.map((v) => '<option value="' + esc(v) + '"></option>').join("") +
    "</datalist>";
  // A text box that also offers a pick list.
  const combo = (label, name, list, value = "", placeholder = "") =>
    "<label><span>" +
    label +
    '</span><input name="' +
    name +
    '" list="' +
    list +
    '" autocomplete="off" value="' +
    esc(value) +
    '" placeholder="' +
    esc(placeholder) +
    '" /></label>';
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, cls = "") =>
    '<span class="tag' + (cls ? " " + cls : "") + '">' + esc(t) + "</span>";
  const fail = (msg) => {
    q("[data-status]").textContent = msg;
  };
  function dueBadge(l) {
    if (l.back) return badge("Returned " + (l.backAt || ""), "good");
    const left = toMin(l.due) - shifts[s.phase].now;
    if (left < 0) return badge("Overdue · was due " + l.due, "warn");
    if (left <= 180) return badge("Due " + l.due, "warn");
    return badge("Due " + l.due);
  }
  function slipSub(l) {
    const parts = [l.req, "Collected by " + l.who];
    if (!l.back && holderOf(l) !== l.who) parts.push("Now with " + holderOf(l));
    if (!l.back && l.toldBy) parts.push("Reported by " + l.toldBy);
    return parts.join(" · ");
  }
  // A slip row plus its inline check-in or follow-up form.
  function slipRow(l, label) {
    const actions = l.back
      ? dueBadge(l)
      : '<div class="buttons">' +
        dueBadge(l) +
        btn("Record return", "check", l.num) +
        btn("Still out…", "follow", l.num) +
        "</div>";
    let html = row(label, slipSub(l), actions);
    if (!l.back && s.checking === l.num) html += checkForm(l);
    if (!l.back && s.following === l.num) html += followForm(l);
    return html;
  }
  function checkForm(l) {
    return (
      '<form data-check data-num="' +
      l.num +
      '" class="record"><h3>Check in against slip L-' +
      l.num +
      '</h3><div class="form"><label><span>Unit label on the item in your hands</span><input name="label" autocomplete="off" required placeholder="e.g. PR-04" /></label></div><small>Read the asset tag on the item, not the screen. The slip closes only if the label matches the unit on it.</small><div class="buttons"><button type="submit" class="primary">Check in</button>' +
      btn("Cancel", "cancelinline") +
      "</div></form>"
    );
  }
  function followForm(l) {
    return (
      '<form data-follow data-num="' +
      l.num +
      '" class="record"><h3>' +
      esc(l.asset + " is not coming back yet") +
      '</h3><div class="form">' +
      combo("Who has it now", "holder", "dl-people", holderOf(l), "Type or pick a name") +
      combo("Promised back", "due", "dl-times", "", "e.g. Sat 9 am") +
      combo("Told to the desk by", "by", "dl-people", "", "Type or pick a name") +
      "</div>" +
      datalist("dl-people", knownPeople()) +
      datalist("dl-times", suggestedTimes) +
      '<small>Saved on the slip and written to the desk book, so the next shift sees it in the loan register.</small><div class="buttons"><button type="submit" class="primary">Save to slip L-' +
      l.num +
      "</button>" +
      btn("Cancel", "cancelinline") +
      "</div></form>"
    );
  }
  function progress(r) {
    const total = r.items.length;
    const outN = openFor(r).length;
    const none = remaining(r).length;
    const backN = total - outN - none;
    if (none === total) return badge("Not issued");
    if (!outN && !none) return badge("All back · closed", "good");
    if (outN && backN > 0)
      return badge(
        backN + " of " + total + " back · " + outN + " still out",
        "warn",
      );
    return badge(outN + " out" + (none ? " · " + none + " not issued" : ""));
  }
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const missing = remaining(r);
      html +=
        '<div class="buttons">' +
        btn("Back to list", "close") +
        (missing.length
          ? btn(
              "Issue " + missing.length + " remaining",
              "issuefor",
              r.id,
              "primary",
            )
          : "") +
        "</div>" +
        '<div class="record"><small>' +
        esc(r.id) +
        " · Approved</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Return by</b> " +
        esc(r.due) +
        "</p><p><b>Can collect</b> " +
        esc(r.collectors.join(", ")) +
        "</p><p>" +
        esc(r.note) +
        "</p></div>" +
        '<div class="sectionhead checklist"><div><h3>Approved equipment</h3><small>Each item, the unit that left the desk, and who has it now</small></div>' +
        progress(r) +
        "</div>";
      for (const type of new Set(r.items)) {
        const slips = slipsOf(r, type);
        for (const l of slips)
          html += slipRow(l, type + " · " + l.asset + " · L-" + l.num);
        for (let i = slips.length; i < count(r.items, type); i++)
          html += row(type, "Not issued yet", badge("Not issued"));
      }
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club + " · Return by " + r.due,
            '<div class="buttons">' +
              progress(r) +
              btn("View form", "request", r.id) +
              "</div>",
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const l = out(a.id);
      const status = a.repair ? "In repair" : l ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model +
          " · " +
          a.bin +
          (l
            ? " · " + l.req + " · with " + holderOf(l) + " · due " + l.due
            : ""),
        badge(status, status === "On shelf" ? "good" : ""),
      );
    }
    return html;
  }
  function issueForm() {
    const d = s.draft || {};
    const r = getReq(d.req);
    const picked = d.units || [];
    // With a request chosen, offer only on-shelf units of the types it still needs.
    const need = r ? issuable(r) : [];
    const pickable = assets.filter(
      (a) => !a.repair && !out(a.id) && (!r || need.includes(a.type)),
    );
    let html =
      '<form data-issue><div class="form"><label class="full"><span>Approved request</span><select name="req" required><option value="">Select…</option>' +
      opts(
        requests.map((x) => [x.id, x.id + " · " + x.club + " · " + x.event]),
        d.req,
      ) +
      "</select></label>";
    html +=
      '<fieldset class="full picks"><legend>Units leaving the desk <small>' +
      (r
        ? need.length
          ? "Can go out: " + esc(need.join(", "))
          : "Everything on " + esc(r.id) + " is already out."
        : "Choose a request to see its approved units.") +
      "</small></legend>" +
      (r && pickable.length
        ? '<div class="buttons">' +
          pickable
            .map(
              (a) =>
                '<label><input type="checkbox" name="unit" value="' +
                a.id +
                '"' +
                (picked.includes(a.id) ? " checked" : "") +
                " /> " +
                esc(a.id + " · " + a.type + " · " + a.bin) +
                "</label>",
            )
            .join("") +
          "</div>"
        : "") +
      '<label><span>Or type unit labels</span><input name="typed" autocomplete="off" value="' +
      esc(d.typed || "") +
      '" placeholder="e.g. PR-04, SP-02, AD-12" /></label></fieldset>';
    html +=
      combo(
        "Collected by",
        "who",
        "dl-people",
        d.who || "",
        r ? "Can collect: " + r.collectors.join(", ") : "Type or pick a name",
      ) +
      combo(
        "Return by",
        "due",
        "dl-times",
        d.due || "",
        r ? "As approved · " + r.due : "As approved",
      ) +
      '<label class="full check"><input type="checkbox" name="ok"' +
      (d.ok ? " checked" : "") +
      " /> The request owner has confirmed this person can collect (only needed for someone not on the request)</label>" +
      "</div>" +
      datalist("dl-people", knownPeople()) +
      datalist("dl-times", suggestedTimes) +
      '<button type="submit" class="primary">Save issue slips</button> <small>Each unit gets its own slip, so each one is returned and checked in separately.</small></form>';
    return html;
  }
  function register() {
    const openCount = s.loans.filter((l) => !l.back).length;
    let html = head(
      "Loan register",
      "One slip per physical unit · " + openCount + " out",
      s.editing
        ? btn("Done", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) return html + issueForm();
    html +=
      '<form data-checkin class="buttons"><label>Item handed in <input name="label" autocomplete="off" required placeholder="Unit label, e.g. AD-12" /></label><button type="submit" class="primary">Find slip and check in</button></form>';
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans.filter((l) => !s.onlyOpen || !l.back).slice();
    // Outstanding: soonest due first. All slips: newest first.
    if (s.onlyOpen) shown.sort((a, b) => toMin(a.due) - toMin(b.due));
    else shown.reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown)
      html += slipRow(l, "L-" + l.num + " · " + l.asset + " · " + typeOf(l));
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([
        shifts[n.phase].time,
        n.author || "Counter handover",
        n.text,
      ]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
    undoBtn.hidden = !s.undo;
    undoBtn.setAttribute(
      "aria-label",
      s.undo ? "Undo check-in of slip L-" + s.undo : "Undo",
    );
    const focus = q("[data-check] input, [data-follow] input");
    if (focus) focus.focus();
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  // Close a slip only for the unit physically handed in.
  function checkIn(raw, num) {
    const label = String(raw || "").trim().toUpperCase();
    const unit = getAsset(label);
    if (!unit)
      return fail("No unit is labelled “" + raw + "”. Check the asset tag.");
    const l = out(unit.id);
    const target = num ? getLoan(num) : l;
    if (!l)
      return fail(
        unit.id +
          " is not on loan. It is " +
          (unit.repair ? "in repair" : "on shelf " + unit.bin) +
          (num ? ", so it is not the unit on slip L-" + num : "") +
          ". Nothing was closed.",
      );
    if (l !== target)
      return fail(
        unit.id +
          " belongs to slip L-" +
          l.num +
          " (" +
          l.req +
          "), not L-" +
          target.num +
          ". Nothing was closed.",
      );
    l.back = true;
    l.backAt = shifts[s.phase].time;
    s.undo = l.num;
    s.checking = 0;
    s.following = 0;
    const r = getReq(l.req);
    const left = openFor(r).length;
    commit(
      unit.id +
        " checked in to shelf " +
        unit.bin +
        ". Slip L-" +
        l.num +
        " closed. " +
        r.id +
        (left
          ? " still has " + left + " item" + (left > 1 ? "s" : "") + " out."
          : " is complete. Everything is back."),
    );
  }
  function readDraft(f) {
    const form = new FormData(f);
    return {
      req: String(form.get("req") || ""),
      units: form.getAll("unit").map(String),
      typed: String(form.get("typed") || ""),
      who: String(form.get("who") || ""),
      due: String(form.get("due") || ""),
      ok: form.get("ok") === "on",
    };
  }
  function issue(f) {
    const d = readDraft(f);
    s.draft = d;
    const r = getReq(d.req);
    if (!r) return fail("Choose the approved request first.");
    const typed = d.typed
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map((x) => x.toUpperCase());
    const ids = [...new Set([...d.units, ...typed])];
    if (!ids.length) return fail("Pick or type at least one unit leaving the desk.");
    for (const id of ids) {
      const unit = getAsset(id);
      if (!unit) return fail("No unit is labelled “" + id + "”. Nothing was issued.");
      if (unit.repair) return fail(id + " is in repair. Nothing was issued.");
      const l = out(id);
      if (l) return fail(id + " is already out on slip L-" + l.num + ". Nothing was issued.");
      if (!r.items.includes(unit.type))
        return fail(
          id + " is a " + unit.type + ", which is outside " + r.id + ". Nothing was issued.",
        );
    }
    const need = issuable(r);
    for (const type of new Set(ids.map((id) => getAsset(id).type))) {
      const asked = ids.filter((id) => getAsset(id).type === type).length;
      const allowed = count(need, type);
      if (asked > allowed)
        return fail(
          r.id +
            " has " +
            (allowed ? "only " + allowed : "no more") +
            " " +
            type +
            " left to issue, but " +
            asked +
            (asked > 1 ? " were" : " was") +
            " chosen. Nothing was issued.",
        );
    }
    const who = tidyName(d.who);
    if (!who) return fail("Enter who is collecting.");
    const listed = r.collectors.includes(who);
    if (!listed && !d.ok)
      return fail(
        who +
          " is not on the collect list for " +
          r.id +
          " (" +
          r.collectors.join(", ") +
          "). Tick the box once the owner has confirmed.",
      );
    const due = d.due.trim() ? tidyTime(d.due) : r.due;
    if (!due)
      return fail("Write the return time like “Sat 9 am”, “Sat 11:30 am” or “Sat noon”.");
    if (toMin(due) > toMin(r.due))
      return fail("Return time is later than the approved " + r.due + ". Nothing was issued.");
    if (toMin(due) <= shifts[s.phase].now)
      return fail("The return time " + due + " has already passed. Nothing was issued.");
    const first = Math.max(...s.loans.map((l) => l.num)) + 1;
    ids.forEach((asset, i) =>
      s.loans.push({ num: first + i, req: r.id, asset, who, holder: who, due, back: false }),
    );
    if (!listed)
      s.notes.push({
        phase: s.phase,
        author: "Counter handover · " + r.id,
        text:
          who +
          " collected " +
          ids.join(", ") +
          " on the owner's confirmation. They are not on the request's collect list.",
      });
    const last = first + ids.length - 1;
    const left = remaining(r);
    s.editing = left.length > 0;
    s.draft = left.length ? { req: r.id, who } : {};
    commit(
      "Issued " +
        ids.join(", ") +
        " to " +
        who +
        " on " +
        (ids.length > 1 ? "slips L-" + first + " to L-" + last + ", one per unit" : "slip L-" + first) +
        ". Due " +
        due +
        ". " +
        (left.length
          ? left.length + " approved item" + (left.length > 1 ? "s" : "") + " still to issue: " + left.join(", ") + "."
          : r.id + " is fully issued."),
    );
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    // Undo is offered only straight after a check-in.
    const undo = s.undo;
    s.undo = null;
    switch (b.dataset.action) {
      case "undo": {
        const l = getLoan(undo);
        if (!l || !l.back) break;
        l.back = false;
        delete l.backAt;
        s.notice =
          "Check-in undone. " +
          l.asset +
          " is back on slip L-" +
          l.num +
          " (" +
          l.req +
          ", with " +
          holderOf(l) +
          ").";
        break;
      }
      case "restart":
        s = original();
        break;
      case "advance": {
        if (s.phase < 2) s.phase++;
        const now = shifts[s.phase].now;
        const late = s.loans.filter(
          (l) => !l.back && toMin(l.due) < now,
        );
        s.checking = s.following = 0;
        s.notice = late.length
          ? "Shift time updated. " +
            late.map((l) => "L-" + l.num + " (" + l.asset + ")").join(", ") +
            (late.length > 1 ? " are" : " is") +
            " overdue. Use Still out… to record who has it and when it is coming back."
          : "Shift time updated.";
        break;
      }
      case "tab":
        s.tab = v;
        s.editing = false;
        s.checking = s.following = 0;
        break;
      case "close":
        s.selected = "";
        s.checking = s.following = 0;
        break;
      case "request":
        s.selected = v;
        break;
      case "issuefor": {
        const r = getReq(v);
        s.tab = "Loan register";
        s.editing = true;
        // Pre-tick one on-shelf unit for each approved item still to issue.
        const units = [];
        for (const type of remaining(r)) {
          const a = assets.find(
            (x) => x.type === type && !x.repair && !out(x.id) && !units.includes(x.id),
          );
          if (a) units.push(a.id);
        }
        s.draft = {
          req: v,
          units,
          who: r.collectors.length === 1 ? r.collectors[0] : "",
        };
        break;
      }
      case "new":
        s.editing = true;
        s.draft = {};
        break;
      case "cancel":
        s.editing = false;
        s.draft = {};
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "check":
        s.checking = Number(v);
        s.following = 0;
        break;
      case "follow":
        s.following = Number(v);
        s.checking = 0;
        break;
      case "cancelinline":
        s.checking = s.following = 0;
        break;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
      return;
    }
    const f = e.target.closest("[data-issue]");
    if (!f) return;
    const d = readDraft(f);
    if (e.target.name === "req") {
      // A new request resets the units; keep the name only if it fits.
      const r = getReq(d.req);
      d.units = [];
      d.typed = "";
      d.due = "";
      d.who =
        r && r.collectors.includes(tidyName(d.who))
          ? d.who
          : r && r.collectors.length === 1
            ? r.collectors[0]
            : "";
      s.draft = d;
      paint();
    } else s.draft = d;
  });
  root.addEventListener("input", (e) => {
    const f = e.target.closest("[data-issue]");
    if (f) s.draft = readDraft(f);
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    s.undo = null;
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-check]"))
      return checkIn(form.get("label"), Number(f.dataset.num));
    if (f.matches("[data-checkin]")) return checkIn(form.get("label"));
    if (f.matches("[data-issue]")) return issue(f);
    if (f.matches("[data-follow]")) {
      const l = getLoan(f.dataset.num);
      if (!l || l.back) return;
      const holder = tidyName(form.get("holder")),
        by = tidyName(form.get("by")),
        due = tidyTime(form.get("due"));
      if (!holder) return fail("Enter who has " + l.asset + " now.");
      if (!due)
        return fail("Write the promised time like “Sat 9 am”, “Sat 11:30 am” or “Sat noon”.");
      if (toMin(due) <= shifts[s.phase].now)
        return fail("The promised time " + due + " has already passed.");
      if (!by) return fail("Enter who told the desk.");
      l.holder = holder;
      l.due = due;
      l.toldBy = by;
      s.following = 0;
      s.notes.push({
        phase: s.phase,
        author: "Counter handover · " + l.req,
        text:
          l.asset +
          " (" +
          typeOf(l) +
          ", slip L-" +
          l.num +
          ") is still out with " +
          holder +
          ". Promised back " +
          due +
          ". Reported by " +
          by +
          ".",
      });
      commit(
        "Slip L-" + l.num + " updated: " + l.asset + " is with " + holder + ", due " + due + ".",
      );
    }
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 3 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          typeof l.who === "string" &&
          toMin(l.due) !== null,
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      editing: false,
      draft: {},
      checking: 0,
      following: 0,
      undo: null,
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
