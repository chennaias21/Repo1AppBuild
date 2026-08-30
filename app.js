(function () {
  "use strict";

  /* ---------------- icons ---------------- */
  var ICONS = {
    check: '<path d="M4 12l5 5L20 6"/>',
    clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.6V12l3.1 1.9"/>',
    flag: '<path d="M5 3v18"/><path d="M5 4.2h11l-2.6 3.8L16 11.8H5"/>',
    pencil: '<path d="M4 20h4L18.4 9.6a2.1 2.1 0 0 0-3-3L5 16.9V20z"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V4.3h5V7"/><path d="M6.2 7l.9 13h9.8l.9-13"/>',
    forward: '<path d="M4.5 12h14"/><path d="M13 6l6 6-6 6"/>',
    bell: '<path d="M6 10.2a6 6 0 0 1 12 0c0 3.9 1.4 5.3 1.4 5.3H4.6S6 14.1 6 10.2z"/><path d="M10 19.2a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
    list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="4.2" cy="6" r="1.1"/><circle cx="4.2" cy="12" r="1.1"/><circle cx="4.2" cy="18" r="1.1"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    download: '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 19h14"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>'
  };
  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24">' + ICONS[name] + "</svg>";
  }
  function iconMaskUrl(name) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<g fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      ICONS[name] +
      "</g></svg>";
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  function paintStaticIcons(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-icon]"), function (el) {
      var name = el.getAttribute("data-icon");
      if (ICONS[name]) el.style.setProperty("--m", iconMaskUrl(name));
    });
  }
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : s;
    return d.innerHTML;
  }

  /* ---------------- date helpers ---------------- */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function dateToStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function strToDate(s) {
    var p = s.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function todayStr() { return dateToStr(new Date()); }
  function addDaysStr(s, n) {
    var d = strToDate(s);
    d.setDate(d.getDate() + n);
    return dateToStr(d);
  }
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longLabel(s) {
    var d = strToDate(s);
    return WEEKDAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate();
  }
  function navLabel(s) {
    var t = todayStr();
    if (s === t) return "Today — " + longLabel(s);
    if (s === addDaysStr(t, 1)) return "Tomorrow — " + longLabel(s);
    if (s === addDaysStr(t, -1)) return "Yesterday — " + longLabel(s);
    return longLabel(s);
  }
  function to12(t24) {
    var parts = t24.split(":");
    var h = parseInt(parts[0], 10);
    var ap = h >= 12 ? "PM" : "AM";
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ":" + parts[1] + " " + ap;
  }
  function to24(t12) {
    var m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t12 || "");
    if (!m) return "09:00";
    var h = parseInt(m[1], 10);
    if (/pm/i.test(m[3]) && h !== 12) h += 12;
    if (/am/i.test(m[3]) && h === 12) h = 0;
    return pad2(h) + ":" + m[2];
  }

  /* ---------------- storage ---------------- */
  var STORAGE_KEY = "dailyPlanner:v1";
  var store = null;

  function emptyDay() { return { pending: [], completed: [] }; }

  function loadStore() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through to fresh store */ }
    }
    var t = todayStr();
    var fresh = {
      nextId: 3,
      lastOpenDate: t,
      eodNotifiedDate: null,
      days: {}
    };
    fresh.days[t] = {
      pending: [
        { id: 1, title: "Tap the circle to mark this complete", priority: "medium", time: null, carried: false },
        { id: 2, title: "Add your first real task below", priority: "low", time: null, carried: false }
      ],
      completed: []
    };
    return fresh;
  }

  function saveStore() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable; state stays in memory for this session */ }
  }

  function getDay(dateStr) {
    if (!store.days[dateStr]) store.days[dateStr] = emptyDay();
    return store.days[dateStr];
  }

  function rollForward() {
    var t = todayStr();
    if (store.lastOpenDate === t) return 0;
    var cursor = store.lastOpenDate;
    var guard = 0;
    while (cursor < t && guard < 3650) {
      var next = addDaysStr(cursor, 1);
      var cur = store.days[cursor];
      if (cur && cur.pending.length) {
        var nd = getDay(next);
        cur.pending.forEach(function (task) {
          task.carried = true;
          task.carriedFrom = cursor;
          task.priority = "high";
        });
        nd.pending = cur.pending.concat(nd.pending);
        cur.pending = [];
      }
      cursor = next;
      guard++;
    }
    store.lastOpenDate = t;
    saveStore();
    return getDay(t).pending.filter(function (x) { return x.carried; }).length;
  }

  function carryForwardManually() {
    var t = todayStr();
    var tomorrow = addDaysStr(t, 1);
    var today = getDay(t);
    if (!today.pending.length) return 0;
    today.pending.forEach(function (task) {
      task.carried = true;
      task.carriedFrom = t;
      task.priority = "high";
    });
    var nd = getDay(tomorrow);
    nd.pending = today.pending.concat(nd.pending);
    var n = today.pending.length;
    today.pending = [];
    saveStore();
    return n;
  }

  /* ---------------- app state ---------------- */
  var state = {
    view: "dashboard",
    viewingDate: null,
    openCompleted: true,
    bellOpen: false,
    editingId: null,
    editingDate: null,
    formDateMode: "today",
    formCustomDate: "",
    formPriority: "medium",
    formReminder: false,
    formTitle: "",
    formTime: "09:00",
    reschedule: null
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function stats(dateStr) {
    var d = getDay(dateStr);
    var total = d.pending.length + d.completed.length;
    var completed = d.completed.length;
    var pending = d.pending.length;
    var high = d.pending.filter(function (t) { return t.priority === "high"; }).length;
    var carried = d.pending.filter(function (t) { return t.carried; }).length;
    var pct = total ? Math.round((completed / total) * 100) : 0;
    return { total: total, pending: pending, completed: completed, high: high, carried: carried, pct: pct };
  }

  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._h);
    toast._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function priorityBadge(p) {
    return '<span class="badge pr-' + p + '">' + p.charAt(0).toUpperCase() + p.slice(1) + "</span>";
  }

  function taskCard(t, dateStr, completed) {
    var meta = priorityBadge(t.priority);
    if (t.time) meta += '<span class="badge time">' + icon("clock") + " " + t.time + "</span>";
    if (t.carried) meta += '<span class="badge carried">' + icon("flag") + " Carried from " + longLabel(t.carriedFrom).split(",")[0] + "</span>";
    if (completed && t.doneAt) meta += '<span class="badge time">Done ' + t.doneAt + "</span>";
    return (
      '<div class="task-card p-' + t.priority + (completed ? " completed" : "") + '" data-id="' + t.id + '" data-date="' + dateStr + '">' +
      '<button class="check' + (completed ? " done" : "") + '" data-action="toggle" data-id="' + t.id + '" data-date="' + dateStr + '" aria-label="' + (completed ? "Mark as pending" : "Mark as complete") + '">' + (completed ? icon("check") : "") + "</button>" +
      '<div class="tc-body">' +
      '<p class="tc-title">' + esc(t.title) + "</p>" +
      '<div class="tc-meta">' + meta + "</div>" +
      "</div>" +
      '<div class="tc-actions">' +
      '<button class="icon-btn" data-action="edit" data-id="' + t.id + '" data-date="' + dateStr + '" aria-label="Edit">' + icon("pencil") + "</button>" +
      '<button class="icon-btn" data-action="reschedule" data-id="' + t.id + '" data-date="' + dateStr + '" aria-label="Reschedule">' + icon("forward") + "</button>" +
      '<button class="icon-btn danger" data-action="delete" data-id="' + t.id + '" data-date="' + dateStr + '" aria-label="Delete">' + icon("trash") + "</button>" +
      "</div>" +
      "</div>"
    );
  }

  function renderRing(pct) {
    var r = 30, c = 2 * Math.PI * r;
    var off = c - (pct / 100) * c;
    return (
      '<svg class="ring" width="84" height="84" viewBox="0 0 72 72">' +
      '<circle cx="36" cy="36" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="7"/>' +
      '<circle cx="36" cy="36" r="' + r + '" fill="none" stroke="var(--success)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 36 36)"/>' +
      '<text x="36" y="41" text-anchor="middle" font-size="17">' + pct + "%</text>" +
      "</svg>"
    );
  }

  /* ---------------- views ---------------- */
  function viewDashboard() {
    var t = todayStr();
    var s = stats(t);
    var d = getDay(t);
    var upcoming = d.pending.slice(0, 5);
    var headline = s.pending === 0 ? "You are all caught up" : s.pending + " task" + (s.pending === 1 ? "" : "s") + " left today";
    return (
      '<div class="hero">' +
      renderRing(s.pct) +
      '<div class="hero-copy">' +
      '<p class="eyebrow">' + longLabel(t) + "</p>" +
      "<h2>" + headline + "</h2>" +
      "<p>" + s.completed + " of " + s.total + " tasks done" + (s.carried ? " · " + s.carried + " carried forward from yesterday" : "") + ".</p>" +
      "</div>" +
      "</div>" +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="n">' + s.total + '</div><div class="l">Total tasks</div></div>' +
      '<div class="stat"><div class="n">' + s.pending + '</div><div class="l">Pending</div></div>' +
      '<div class="stat ok"><div class="n">' + s.completed + '</div><div class="l">Completed</div></div>' +
      '<div class="stat hi"><div class="n">' + s.high + '</div><div class="l">High priority</div></div>' +
      '<div class="stat carry"><div class="n">' + s.carried + '</div><div class="l">Carried forward</div></div>' +
      '<div class="stat mid"><div class="n">' + s.pct + '%</div><div class="l">Completion</div></div>' +
      "</div>" +
      '<div class="section-title"><h3>Up next</h3><span class="count-pill">' + d.pending.length + ' pending</span></div>' +
      '<div class="task-list">' + (upcoming.length ? upcoming.map(function (t2) { return taskCard(t2, todayStr(), false); }).join("") : '<p class="empty">Nothing pending — enjoy the quiet.</p>') + "</div>"
    );
  }

  function viewTasks() {
    var dateStr = state.viewingDate;
    var d = getDay(dateStr);
    return (
      '<div class="day-nav">' +
      '<button class="arrow" data-action="day-prev" data-icon="left" aria-label="Previous day"></button>' +
      '<span class="label">' + navLabel(dateStr) + "</span>" +
      (dateStr !== todayStr() ? '<button class="today-link" data-action="day-today">Jump to today</button>' : "") +
      '<button class="arrow" data-action="day-next" data-icon="right" aria-label="Next day"></button>' +
      "</div>" +
      '<div class="section-title"><h3>Pending</h3><span class="count-pill">' + d.pending.length + "</span></div>" +
      '<div class="task-list" style="margin-bottom:26px;">' + (d.pending.length ? d.pending.map(function (t) { return taskCard(t, dateStr, false); }).join("") : '<p class="empty">All clear for ' + navLabel(dateStr).split("—")[0].trim() + ".</p>") + "</div>" +
      '<button class="completed-toggle' + (state.openCompleted ? " open" : "") + '" id="toggleCompleted">' + icon("chevron") + " Completed (" + d.completed.length + ")</button>" +
      (state.openCompleted ? '<div class="task-list" style="margin-top:10px;">' + (d.completed.length ? d.completed.map(function (t) { return taskCard(t, dateStr, true); }).join("") : '<p class="empty">Nothing completed here yet.</p>') + "</div>" : "")
    );
  }

  function findTask(dateStr, id) {
    var d = store.days[dateStr];
    if (!d) return null;
    var arr = d.pending.concat(d.completed);
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }

  function viewAdd() {
    var editing = state.editingId != null;
    var minDate = todayStr();
    return (
      '<div class="form-card">' +
      '<div class="field"><label>Task</label>' +
      '<input type="text" id="fTitle" placeholder="e.g. Send invoice to Acme Corp" value="' + esc(state.formTitle) + '" maxlength="120"></div>' +
      '<div class="field"><label>Day</label>' +
      '<div class="chip-row" id="fDay">' +
      '<button type="button" class="chip' + (state.formDateMode === "today" ? " active" : "") + '" data-day="today">Today</button>' +
      '<button type="button" class="chip' + (state.formDateMode === "tomorrow" ? " active" : "") + '" data-day="tomorrow">Tomorrow</button>' +
      '<button type="button" class="chip' + (state.formDateMode === "custom" ? " active" : "") + '" data-day="custom">Pick a date</button>' +
      "</div>" +
      (state.formDateMode === "custom" ? '<input type="date" id="fCustomDate" min="' + minDate + '" value="' + (state.formCustomDate || minDate) + '" style="margin-top:10px;">' : "") +
      "</div>" +
      '<div class="field"><label>Priority</label>' +
      '<div class="chip-row" id="fPriority">' +
      ["low", "medium", "high"].map(function (p) {
        return '<button type="button" class="chip pr-' + p + (state.formPriority === p ? " active" : "") + '" data-p="' + p + '">' + p.charAt(0).toUpperCase() + p.slice(1) + "</button>";
      }).join("") +
      "</div></div>" +
      '<div class="field">' +
      '<div class="switch-row"><div><div class="lbl">Due time &amp; reminder</div><div class="sub">Get a notification when it is due</div></div>' +
      '<button type="button" class="switch' + (state.formReminder ? " on" : "") + '" id="fReminderSwitch" aria-label="Toggle reminder"></button></div>' +
      '<div class="time-reveal' + (state.formReminder ? " open" : "") + '"><input type="time" id="fTime" value="' + esc(state.formTime) + '" style="margin-top:10px;"></div>' +
      "</div>" +
      '<div class="form-actions">' +
      (editing ? '<button class="btn ghost" id="fCancel">Cancel</button>' : "") +
      '<button class="btn primary" id="fSave">' + (editing ? "Save changes" : "Add task") + "</button>" +
      "</div>" +
      "</div>"
    );
  }

  /* ---------------- render ---------------- */
  function render() {
    var s = stats(todayStr());
    $("#bellBadge").hidden = s.pending === 0;
    $("#bellBadge").textContent = s.pending;

    var titles = { dashboard: "Dashboard", tasks: "Tasks", add: state.editingId != null ? "Edit task" : "Add task" };
    $("#topTitle").textContent = titles[state.view];
    $("#topDate").textContent = longLabel(todayStr());

    var html;
    if (state.view === "dashboard") html = viewDashboard();
    else if (state.view === "tasks") html = viewTasks();
    else html = viewAdd();
    $("#view").innerHTML = html;

    $$(".navitem[data-view], .bn-item[data-view]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.view === state.view);
    });
    $("#sidebarFoot").textContent = longLabel(todayStr());

    paintStaticIcons(document);
    renderEod();
    renderReschedule();
  }

  /* ---------------- end-of-day panel ---------------- */
  function renderEod() {
    var backdrop = $("#backdrop"), panel = $("#eodPanel");
    var showing = state.bellOpen;
    backdrop.classList.toggle("show", showing);
    panel.classList.toggle("show", showing);
    if (!showing) return;
    var t = todayStr();
    var d = getDay(t);
    var s = stats(t);
    if (s.pending === 0) {
      panel.innerHTML =
        '<div class="eod-head"><h4>End of day</h4><button class="eod-close" id="eodClose" data-icon="x"></button></div>' +
        '<p class="eod-done">Today is fully wrapped up — nothing to carry forward.</p>';
    } else {
      panel.innerHTML =
        '<div class="eod-head"><h4>End of day check-in</h4><button class="eod-close" id="eodClose" data-icon="x"></button></div>' +
        '<p class="eod-sub">' + s.pending + " task" + (s.pending === 1 ? "" : "s") + " still pending for today.</p>" +
        '<div class="eod-list">' + d.pending.slice(0, 5).map(function (task) {
          return '<div class="eod-item"><span>' + esc(task.title) + "</span><b>" + task.priority + "</b></div>";
        }).join("") + "</div>" +
        '<div class="eod-actions"><button class="btn primary" id="eodCarry">Carry forward now</button>' +
        '<button class="btn ghost" id="eodReview">Review pending</button></div>';
    }
    paintStaticIcons(panel);
    var close = $("#eodClose"); if (close) close.onclick = function () { state.bellOpen = false; render(); };
    var carry = $("#eodCarry"); if (carry) carry.onclick = function () {
      var n = carryForwardManually();
      state.bellOpen = false;
      state.view = "tasks";
      state.viewingDate = addDaysStr(todayStr(), 1);
      render();
      toast(n + " task" + (n === 1 ? "" : "s") + " carried forward to tomorrow as High priority");
    };
    var review = $("#eodReview"); if (review) review.onclick = function () { state.bellOpen = false; state.view = "tasks"; state.viewingDate = todayStr(); render(); };
  }

  /* ---------------- reschedule modal ---------------- */
  function renderReschedule() {
    var modal = $("#rescheduleModal");
    var backdrop = $("#backdrop");
    if (!state.reschedule) { modal.classList.remove("show"); if (!state.bellOpen) backdrop.classList.remove("show"); return; }
    backdrop.classList.add("show");
    modal.classList.add("show");
    var r = state.reschedule;
    var task = findTask(r.date, r.id);
    if (!task) { state.reschedule = null; modal.classList.remove("show"); return; }
    var tmr = addDaysStr(todayStr(), 1);
    modal.innerHTML =
      '<h4>Reschedule task</h4>' +
      '<div class="chip-row" style="margin-bottom:12px;">' +
      '<button type="button" class="chip" id="rsToday">Today</button>' +
      '<button type="button" class="chip" id="rsTomorrow">Tomorrow</button>' +
      "</div>" +
      '<input type="date" id="rsDate" min="' + todayStr() + '" value="' + (r.date < todayStr() ? todayStr() : r.date) + '" style="margin-bottom:14px;">' +
      '<div class="form-actions"><button class="btn ghost" id="rsCancel">Cancel</button><button class="btn primary" id="rsMove">Move</button></div>';
    $("#rsToday").onclick = function () { moveTask(r.date, r.id, todayStr()); };
    $("#rsTomorrow").onclick = function () { moveTask(r.date, r.id, tmr); };
    $("#rsCancel").onclick = function () { state.reschedule = null; render(); };
    $("#rsMove").onclick = function () { moveTask(r.date, r.id, $("#rsDate").value || todayStr()); };
  }

  function moveTask(fromDate, id, toDate) {
    if (fromDate === toDate) { state.reschedule = null; render(); return; }
    var fd = getDay(fromDate);
    var idx = fd.pending.findIndex(function (x) { return x.id === id; });
    var task;
    if (idx > -1) { task = fd.pending.splice(idx, 1)[0]; }
    else {
      idx = fd.completed.findIndex(function (x) { return x.id === id; });
      if (idx === -1) { state.reschedule = null; render(); return; }
      task = fd.completed.splice(idx, 1)[0];
      delete task.doneAt;
    }
    getDay(toDate).pending.push(task);
    saveStore();
    state.reschedule = null;
    render();
    toast("Rescheduled to " + navLabel(toDate).split("—")[0].trim());
  }

  /* ---------------- reminders ---------------- */
  function checkReminders() {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    var t = todayStr();
    var d = store.days[t];
    if (!d) return;
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    d.pending.forEach(function (task) {
      if (!task.time || task.notified) return;
      var due = to24(task.time).split(":");
      var dueMin = parseInt(due[0], 10) * 60 + parseInt(due[1], 10);
      if (nowMin >= dueMin) {
        try { new Notification("Daily Planner", { body: task.title, icon: "icons/icon-192.png" }); } catch (e) { /* notifications unsupported in this context */ }
        task.notified = true;
        saveStore();
      }
    });
    if (now.getHours() >= 20 && store.eodNotifiedDate !== t) {
      var s = stats(t);
      if (s.pending > 0) {
        try { new Notification("Daily Planner", { body: s.pending + " task" + (s.pending === 1 ? "" : "s") + " still pending today", icon: "icons/icon-192.png" }); } catch (e) { /* ignore */ }
      }
      store.eodNotifiedDate = t;
      saveStore();
    }
  }

  /* ---------------- form save ---------------- */
  function resetFormFields() {
    state.editingId = null;
    state.formDateMode = "today";
    state.formCustomDate = "";
    state.formPriority = "medium";
    state.formReminder = false;
    state.formTitle = "";
    state.formTime = "09:00";
  }

  function resolveFormDate() {
    if (state.formDateMode === "tomorrow") return addDaysStr(todayStr(), 1);
    if (state.formDateMode === "custom") return state.formCustomDate || todayStr();
    return todayStr();
  }

  function saveForm() {
    var titleEl = $("#fTitle");
    var title = titleEl.value.trim();
    if (!title) { titleEl.focus(); return; }
    var time = null;
    if (state.formReminder) {
      var raw = ($("#fTime") || {}).value || "09:00";
      time = to12(raw);
    }
    var targetDate = resolveFormDate();

    if (state.editingId != null) {
      var task = findTask(state.editingDate, state.editingId);
      task.title = title; task.priority = state.formPriority; task.time = time; task.notified = false;
      if (state.editingDate !== targetDate) {
        var od = getDay(state.editingDate);
        od.pending = od.pending.filter(function (x) { return x.id !== task.id; });
        od.completed = od.completed.filter(function (x) { return x.id !== task.id; });
        getDay(targetDate).pending.push(task);
      }
      toast("Task updated");
    } else {
      var nt = { id: ++store.nextId, title: title, priority: state.formPriority, time: time, carried: false };
      getDay(targetDate).pending.unshift(nt);
      toast("Added to " + navLabel(targetDate).split("—")[0].trim());
    }
    saveStore();
    resetFormFields();
    state.view = "tasks";
    state.viewingDate = targetDate;
    render();
  }

  function toggleTask(dateStr, id) {
    var d = getDay(dateStr);
    var idx = d.pending.findIndex(function (x) { return x.id === id; });
    if (idx > -1) {
      var t = d.pending.splice(idx, 1)[0];
      t.doneAt = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      d.completed.unshift(t);
      toast("Nice — marked complete");
    } else {
      idx = d.completed.findIndex(function (x) { return x.id === id; });
      if (idx > -1) {
        var t2 = d.completed.splice(idx, 1)[0];
        delete t2.doneAt;
        d.pending.push(t2);
        toast("Moved back to pending");
      }
    }
    saveStore();
    render();
  }

  function deleteTask(dateStr, id) {
    var d = getDay(dateStr);
    d.pending = d.pending.filter(function (x) { return x.id !== id; });
    d.completed = d.completed.filter(function (x) { return x.id !== id; });
    saveStore();
    render();
    toast("Task deleted");
  }

  function editTask(dateStr, id) {
    var t = findTask(dateStr, id);
    if (!t) return;
    state.editingId = id;
    state.editingDate = dateStr;
    state.formDateMode = dateStr === todayStr() ? "today" : (dateStr === addDaysStr(todayStr(), 1) ? "tomorrow" : "custom");
    state.formCustomDate = dateStr;
    state.formPriority = t.priority;
    state.formReminder = !!t.time;
    state.formTitle = t.title;
    state.formTime = t.time ? to24(t.time) : "09:00";
    state.view = "add";
    render();
  }

  /* ---------------- install prompt ---------------- */
  var deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    $("#installBtnDesktop").hidden = false;
    $("#installBtnMobile").hidden = false;
  });
  function triggerInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(function () {
      deferredInstallPrompt = null;
      $("#installBtnDesktop").hidden = true;
      $("#installBtnMobile").hidden = true;
    });
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function setupIosBanner() {
    var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isIos || isStandalone()) return;
    var dismissed = false;
    try { dismissed = localStorage.getItem("dailyPlanner:iosBannerDismissed") === "1"; } catch (e) { dismissed = false; }
    if (dismissed) return;
    $("#iosBanner").hidden = false;
    $("#iosBannerClose").onclick = function () {
      $("#iosBanner").hidden = true;
      try { localStorage.setItem("dailyPlanner:iosBannerDismissed", "1"); } catch (e) { /* ignore */ }
    };
    paintStaticIcons($("#iosBanner"));
  }

  /* ---------------- events ---------------- */
  function bindEvents() {
    document.addEventListener("click", function (e) {
      var nav = e.target.closest(".navitem[data-view], .bn-item[data-view]");
      if (nav) {
        if (nav.dataset.view === "add") resetFormFields();
        else state.editingId = null;
        state.view = nav.dataset.view;
        if (state.view === "tasks") state.viewingDate = todayStr();
        render();
        return;
      }

      if (e.target.closest("#bellBtn") || e.target.closest("#bellBtnMobile")) { state.bellOpen = !state.bellOpen; render(); return; }
      if (e.target.closest("#backdrop")) { state.bellOpen = false; state.reschedule = null; render(); return; }
      if (e.target.closest("#installBtnDesktop") || e.target.closest("#installBtnMobile")) { triggerInstall(); return; }

      var actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        var act = actionBtn.dataset.action;
        var id = parseInt(actionBtn.dataset.id, 10);
        var dateStr = actionBtn.dataset.date;
        if (act === "toggle") toggleTask(dateStr, id);
        else if (act === "delete") deleteTask(dateStr, id);
        else if (act === "reschedule") { state.reschedule = { date: dateStr, id: id }; render(); }
        else if (act === "edit") editTask(dateStr, id);
        else if (act === "day-prev") { state.viewingDate = addDaysStr(state.viewingDate, -1); render(); }
        else if (act === "day-next") { state.viewingDate = addDaysStr(state.viewingDate, 1); render(); }
        else if (act === "day-today") { state.viewingDate = todayStr(); render(); }
        return;
      }

      if (e.target.closest("#toggleCompleted")) { state.openCompleted = !state.openCompleted; render(); return; }

      var dayChip = e.target.closest("#fDay .chip");
      if (dayChip) { state.formDateMode = dayChip.dataset.day; render(); return; }
      var prChip = e.target.closest("#fPriority .chip");
      if (prChip) { state.formPriority = prChip.dataset.p; render(); return; }
      if (e.target.closest("#fReminderSwitch")) {
        state.formReminder = !state.formReminder;
        if (state.formReminder && typeof Notification !== "undefined" && Notification.permission === "default") {
          Notification.requestPermission();
        }
        render();
        return;
      }
      if (e.target.closest("#fSave")) { saveForm(); return; }
      if (e.target.closest("#fCancel")) { resetFormFields(); state.view = "tasks"; render(); return; }
    });

    document.addEventListener("input", function (e) {
      if (e.target.id === "fTitle") state.formTitle = e.target.value;
      else if (e.target.id === "fTime") state.formTime = e.target.value;
    });

    document.addEventListener("change", function (e) {
      if (e.target.id === "fCustomDate") { state.formCustomDate = e.target.value; render(); }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target && e.target.id === "fTitle") saveForm();
      if (e.key === "Escape") { if (state.bellOpen || state.reschedule) { state.bellOpen = false; state.reschedule = null; render(); } }
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    store = loadStore();
    var carried = rollForward();
    state.viewingDate = todayStr();
    bindEvents();
    setupIosBanner();
    render();
    if (carried > 0) toast(carried + " task" + (carried === 1 ? "" : "s") + " carried forward from a previous day");

    setInterval(checkReminders, 30000);
    checkReminders();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(function () { /* offline support unavailable; app still works online */ });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
