
(() => {
  const $ = id => document.getElementById(id),
    esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]),
    today = () => new Date().toISOString().slice(0, 10),
    date = s => s
      ? new Date(s + "T00:00:00").toLocaleDateString(undefined, {
          day: "numeric", month: "short", year: "numeric"
        })
      : "â€”";

  let formType = "", editId = null, toastTimer;

  const pageNames = {
    dashboard: "Dashboard",
    patients: "Patients",
    tasks: "Follow-up tasks",
    appointments: "Appointments",
    referrals: "Referrals",
    labs: "Labs & pharmacy",
    alerts: "Alerts & escalations",
    activity: "Activity log",
    reports: "Reports & Analytics",
    "doctor-ai": "Doctor AI Assistant"
  };

  const configs = {
    patient: {
      title: "Add patient",
      perm: "patients",
      fields: [
        ["name", "Full name", "text", 1],
        ["dob", "Date of birth", "date"],
        ["phone", "Contact reference", "text"],
        ["clinic", "Primary clinic", "text", 1],
        ["consent", "Consent status", "select", 1, ["Granted", "Pending", "Revoked"]],
        ["notes", "Coordination notes", "textarea"]
      ]
    },
    task: {
      title: "Create follow-up task",
      perm: "tasks",
      fields: [
        ["patientId", "Patient", "patient", 1],
        ["title", "Task title", "text", 1],
        ["type", "Task type", "select", 1, ["Follow-up", "Lab result review", "Appointment", "Referral", "Lab test", "Pharmacy", "Other"]],
        ["dueDate", "Due date", "date", 1],
        ["priority", "Priority", "select", 1, ["High", "Medium", "Low"]],
        ["status", "Status", "select", 1, ["Pending", "In progress", "Completed", "Escalated"]],
        ["owner", "Assigned owner/team", "select", 1, ["Care Coordinator", "Clinician", "Lab Staff", "Pharmacy Staff"]],
        ["notes", "Notes", "textarea"]
      ]
    },
    appointment: {
      title: "Schedule appointment",
      perm: "appointments",
      fields: [
        ["patientId", "Patient", "patient", 1],
        ["date", "Date", "date", 1],
        ["time", "Time", "time", 1],
        ["provider", "Clinic/provider", "text", 1],
        ["kind", "Appointment type", "select", 1, ["Initial visit", "Follow-up visit", "Lab appointment", "Result review", "Specialist visit", "Other"]],
        ["status", "Status", "select", 1, ["Scheduled", "Confirmed", "Completed", "Missed", "Cancelled"]],
        ["notes", "Notes", "textarea"]
      ]
    },
    referral: {
      title: "New referral",
      perm: "referrals",
      fields: [
        ["patientId", "Patient", "patient", 1],
        ["destination", "Receiving clinic/specialist", "text", 1],
        ["reason", "Coordination reason", "text", 1],
        ["date", "Requested/sent date", "date", 1],
        ["status", "Status", "select", 1, ["Requested", "Sent", "Accepted", "Completed", "Blocked"]],
        ["owner", "Assigned owner/team", "select", 1, ["Care Coordinator", "Clinician"]],
        ["notes", "Notes", "textarea"]
      ]
    },
    lab: {
      title: "Add lab/pharmacy item",
      perm: "labs",
      fields: [
        ["patientId", "Patient", "patient", 1],
        ["kind", "Type", "select", 1, ["Lab test", "Pharmacy"]],
        ["item", "Test/follow-up item", "text", 1],
        ["provider", "Laboratory/pharmacy", "text", 1],
        ["dueDate", "Due date", "date", 1],
        ["status", "Status", "select", 1, ["Ordered", "Scheduled", "Awaiting result", "Result received", "Pharmacy pending", "Completed", "Blocked"]],
        ["owner", "Assigned owner/team", "select", 1, ["Care Coordinator", "Clinician", "Lab Staff", "Pharmacy Staff"]],
        ["notes", "Notes", "textarea"]
      ]
    }
  };

  function toast(s) {
    let t = $("toast");
    t.textContent = s;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  function pill(s) {
    let c = ["Completed", "Confirmed", "Granted", "Accepted", "Result received"].includes(s)
      ? "green"
      : ["Escalated", "Blocked", "Revoked", "Missed", "High"].includes(s)
        ? "red"
        : ["Pending", "Requested", "Awaiting result", "Pharmacy pending", "In progress", "Medium"].includes(s)
          ? "amber"
          : ["Sent", "Scheduled"].includes(s) ? "blue" : "";

    return `<span class="pill ${c}">${esc(s || "â€”")}</span>`;
  }

  function empty(s) {
    return `<div class="empty">${esc(s)}</div>`;
  }

  function table(head, rows) {
    return rows.length
      ? `<div class="table-wrap"><table><thead><tr>${head.map(x => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
      : empty("No records match these filters.");
  }

  function action(label, act, id, disabled = false) {
    return `<button class="mini" data-action="${act}" data-id="${esc(id)}" ${disabled ? "disabled" : ""}>${label}</button>`;
  }

  function acts(...a) {
    return `<div class="actions">${a.join("")}</div>`;
  }

  function patientName(id) {
    let p = CareBackend.patient(id);
    return p
      ? (CareSecurity.canAccessPatient(p) ? p.name : "Restricted â€” consent check")
      : "Unknown patient";
  }

  function can(p) {
    return CareSecurity.can(p);
  }

  function patientOptions(sel = "") {
    return `<option value="">Choose patientâ€¦</option>` +
      CareBackend.list("patients").map(p =>
        `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${esc(p.name)} (${p.id})${p.consent !== "Granted" ? " â€” consent " + p.consent.toLowerCase() : ""}</option>`
      ).join("");
  }

  function renderDashboard() {
    let p = CareBackend.list("patients"),
      t = CareBackend.list("tasks"),
      a = CareBackend.list("appointments"),
      r = CareBackend.list("referrals"),
      l = CareBackend.list("labs"),
      al = CareBackend.list("alerts"),
      open = t.filter(x => !["Completed", "Cancelled"].includes(x.status)),
      over = open.filter(x => x.dueDate < today()),
      oa = al.filter(x => x.status !== "Resolved");

    $("stats").innerHTML = [
      ["Patients", p.length, "Sample directory"],
      ["Open tasks", open.length, "Not completed"],
      ["Overdue items", over.length, "Require review"],
      ["Open alerts", oa.length, "Need staff attention"]
    ].map(x =>
      `<div class="stat"><div class="stat-label">${x[0]}</div><div class="stat-number">${x[1]}</div><div class="stat-foot">${x[2]}</div></div>`
    ).join("");

    let queue = open.sort((x, y) => CareAI.priority(x) - CareAI.priority(y)).slice(0, 5);

    $("priority").innerHTML = queue.length
      ? queue.map(x =>
          `<div class="queue-item"><span class="queue-icon">${x.dueDate < today() ? "!" : ""}</span><div><strong>${esc(x.title)}</strong><p>${esc(patientName(x.patientId))} Â· Due ${date(x.dueDate)}</p>${pill(x.priority)} ${pill(x.status)}</div>${action("Open", "goto-task", x.id)}</div>`
        ).join("")
      : empty("All tasks completed.");

    let areas = [
      ["Follow-up tasks", open.length],
      ["Appointments", a.filter(x => ["Scheduled", "Confirmed"].includes(x.status)).length],
      ["Referrals", r.filter(x => x.status !== "Completed").length],
      ["Labs & pharmacy", l.filter(x => !["Completed", "Result received"].includes(x.status)).length]
    ],
      max = Math.max(1, ...areas.map(x => x[1]));

    $("breakdown").innerHTML = areas.map(x =>
      `<div class="break-row"><div><span>${x[0]}</span><b>${x[1]}</b></div><div class="bar"><span style="width:${x[1] / max * 100}%"></span></div></div>`
    ).join("");

    $("aiSummary").innerHTML = CareAI.analyse().tips.map(x =>
      `<p>â€¢ ${esc(x)}</p>`
    ).join("");

    $("upcoming").innerHTML = table(
      ["Patient", "Appointment", "Provider", "Date/time", "Status"],
      a.filter(x => x.date >= today() && ["Scheduled", "Confirmed"].includes(x.status))
        .sort((x, y) => x.date.localeCompare(y.date))
        .slice(0, 5)
        .map(x =>
          `<tr><td><b>${esc(patientName(x.patientId))}</b><small>${x.patientId}</small></td><td>${esc(x.kind)}</td><td>${esc(x.provider)}</td><td>${date(x.date)}<small>${esc(x.time)}</small></td><td>${pill(x.status)}</td></tr>`
        )
    );

    $("alertCount").textContent = oa.length;
  }

  function renderPatients() {
    let q = ($("patientSearch").value || "").toLowerCase(),
      c = $("patientConsent").value;

    $("patientsTable").innerHTML = table(
      ["Patient", "Clinic", "Consent", "Contact reference", "Actions"],
      CareBackend.list("patients")
        .filter(p =>
          (!q || `${p.name} ${p.id} ${p.clinic}`.toLowerCase().includes(q)) &&
          (!c || p.consent === c)
        )
        .map(p =>
          `<tr><td><b>${esc(p.name)}</b><small>${p.id} Â· DOB ${date(p.dob)}</small></td><td>${esc(p.clinic)}</td><td>${pill(p.consent)}</td><td>${esc(p.consent === "Granted" ? p.phone : "Hidden until consent is confirmed")}</td><td>${acts(action("Edit", "edit-patient", p.id, !can("patients")), action("View tasks", "patient-tasks", p.id))}</td></tr>`
        )
    );
  }

  function renderTasks() {
    let q = ($("taskSearch").value || "").toLowerCase(),
      s = $("taskStatus").value,
      p = $("taskPriority").value;

    $("tasksTable").innerHTML = table(
      ["Task", "Patient", "Due date", "Priority", "Status", "Owner", "Actions"],
      CareBackend.list("tasks")
        .filter(t =>
          (!q || `${t.title} ${CareBackend.patientName(t.patientId)} ${t.id}`.toLowerCase().includes(q)) &&
          (!s || t.status === s) &&
          (!p || t.priority === p)
        )
        .map(t =>
          `<tr><td><b>${esc(t.title)}</b><small>${t.id} Â· ${esc(t.type)}</small></td><td>${esc(patientName(t.patientId))}<small>${t.patientId}</small></td><td>${date(t.dueDate)}${t.dueDate < today() && t.status !== "Completed" ? "<small>Past due</small>" : ""}</td><td>${pill(t.priority)}</td><td>${pill(t.status)}</td><td>${esc(t.owner || "Unassigned")}</td><td>${acts(action("Complete", "complete-task", t.id, t.status === "Completed" || !can("tasks")), action("Escalate", "escalate-task", t.id, t.status === "Completed" || !can("escalate")), action("Edit", "edit-task", t.id, !can("tasks")))}</td></tr>`
        )
    );
  }

  function renderAppointments() {
    let q = ($("appointmentSearch").value || "").toLowerCase(),
      s = $("appointmentStatus").value;

    $("appointmentsTable").innerHTML = table(
      ["Patient", "Type", "Provider", "Date/time", "Status", "Actions"],
      CareBackend.list("appointments")
        .filter(a =>
          (!q || `${CareBackend.patientName(a.patientId)} ${a.provider} ${a.kind}`.toLowerCase().includes(q)) &&
          (!s || a.status === s)
        )
        .map(a =>
          `<tr><td>${esc(patientName(a.patientId))}<small>${a.patientId}</small></td><td>${esc(a.kind)}</td><td>${esc(a.provider)}</td><td>${date(a.date)}<small>${esc(a.time)}</small></td><td>${pill(a.status)}</td><td>${acts(action("Confirm", "confirm-appointment", a.id, a.status !== "Scheduled" || !can("appointments")), action("Complete", "complete-appointment", a.id, !["Scheduled", "Confirmed"].includes(a.status) || !can("appointments")), action("Edit", "edit-appointment", a.id, !can("appointments")))}</td></tr>`
        )
    );
  }

  function renderReferrals() {
    let q = ($("referralSearch").value || "").toLowerCase(),
      s = $("referralStatus").value;

    $("referralsTable").innerHTML = table(
      ["Patient", "Destination/reason", "Date", "Status", "Owner", "Actions"],
      CareBackend.list("referrals")
        .filter(r =>
          (!q || `${CareBackend.patientName(r.patientId)} ${r.destination} ${r.reason}`.toLowerCase().includes(q)) &&
          (!s || r.status === s)
        )
        .map(r =>
          `<tr><td>${esc(patientName(r.patientId))}<small>${r.patientId}</small></td><td><b>${esc(r.destination)}</b><small>${esc(r.reason)}</small></td><td>${date(r.date)}</td><td>${pill(r.status)}</td><td>${esc(r.owner || "Unassigned")}</td><td>${acts(action("Send", "send-referral", r.id, !["Requested", "Blocked"].includes(r.status) || !can("referrals")), action("Accept", "accept-referral", r.id, r.status !== "Sent" || !can("referrals")), action("Complete", "complete-referral", r.id, !["Sent", "Accepted"].includes(r.status) || !can("referrals")), action("Edit", "edit-referral", r.id, !can("referrals")))}</td></tr>`
        )
    );
  }

  function renderLabs() {
    let q = ($("labSearch").value || "").toLowerCase(),
      s = $("labStatus").value;

    $("labsTable").innerHTML = table(
      ["Item", "Patient", "Provider", "Due date", "Status", "Owner", "Actions"],
      CareBackend.list("labs")
        .filter(l =>
          (!q || `${CareBackend.patientName(l.patientId)} ${l.item} ${l.provider}`.toLowerCase().includes(q)) &&
          (!s || l.status === s)
        )
        .map(l =>
          `<tr><td><b>${esc(l.item)}</b><small>${l.id} Â· ${esc(l.kind)}</small></td><td>${esc(patientName(l.patientId))}<small>${l.patientId}</small></td><td>${esc(l.provider)}</td><td>${date(l.dueDate)}</td><td>${pill(l.status)}</td><td>${esc(l.owner || "Unassigned")}</td><td>${acts(action("Complete", "complete-lab", l.id, !can("labs") || ["Completed", "Result received"].includes(l.status)), action("Edit", "edit-lab", l.id, !can("labs")))}</td></tr>`
        )
    );
  }

  function renderAlerts() {
    let a = CareBackend.list("alerts").sort((x, y) =>
      ({ High: 0, Medium: 1, Low: 2 }[x.severity] ?? 3) -
      ({ High: 0, Medium: 1, Low: 2 }[y.severity] ?? 3)
    );

    $("alertsTable").innerHTML = table(
      ["Alert", "Patient", "Severity", "Status", "Detected", "Actions"],
      a.map(x =>
        `<tr><td><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></td><td>${esc(patientName(x.patientId))}<small>${x.patientId}</small></td><td>${pill(x.severity)}</td><td>${pill(x.status)}</td><td>${new Date(x.createdAt).toLocaleString()}</td><td>${acts(action("Open record", "open-alert", x.id), action(x.status === "Resolved" ? "Reopen" : "Resolve", x.status === "Resolved" ? "reopen-alert" : "resolve-alert", x.id, !can("escalate")))}</td></tr>`
      )
    );
  }

  function renderActivity() {
    $("activityTable").innerHTML = table(
      ["Time", "Actor", "Action", "Record", "Details"],
      CareBackend.list("activity").map(a =>
        `<tr><td>${new Date(a.at).toLocaleString()}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(a.entity)}</td><td>${esc(a.detail)}</td></tr>`
      )
    );
  }

  function renderAll() {
    renderDashboard();
    renderPatients();
    renderTasks();
    renderAppointments();
    renderReferrals();
    renderLabs();
    renderAlerts();
    renderActivity();

    if (window.renderCareMeshReports) {
      window.renderCareMeshReports();
    }
  }

  function go(page) {
    document.querySelectorAll(".page").forEach(x =>
      x.classList.toggle("active", x.id === "page-" + page)
    );

    document.querySelectorAll("#nav button").forEach(x =>
      x.classList.toggle("active", x.dataset.page === page)
    );

    $("pageTitle").textContent = pageNames[page] || "Dashboard";

    if (page === "reports" && window.renderCareMeshReports) {
      window.renderCareMeshReports();
    }

    $("sidebar").classList.remove("open");
  }

  function openForm(type, record = null) {
    let cfg = configs[type];

    if (!cfg || !can(cfg.perm)) {
      toast("à¤‡à¤¸ demo role à¤•à¥‹ à¤¯à¤¹ à¤¬à¤¦à¤²à¤¾à¤µ à¤•à¤°à¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤");
      return;
    }

    formType = type;
    editId = record?.id || null;
    $("formTitle").textContent = record ? "Edit record" : cfg.title;
    $("formError").textContent = "";

    $("fields").innerHTML = cfg.fields.map(([key, label, kind, req, opts]) => {
      let val = record?.[key] ?? (["date", "dueDate"].includes(key) ? today() : "");

      let c = kind === "patient"
        ? `<select name="${key}" ${req ? "required" : ""}>${patientOptions(val)}</select>`
        : kind === "select"
          ? `<select name="${key}" ${req ? "required" : ""}>${opts.map(o => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`
          : kind === "textarea"
            ? `<textarea name="${key}">${esc(val)}</textarea>`
            : `<input name="${key}" type="${kind}" value="${esc(val)}" ${req ? "required" : ""} ${kind === "text" ? 'maxlength="180"' : ""}>`;

      return `<div class="field ${kind === "textarea" ? "full" : ""}"><label>${esc(label)}${req ? " *" : ""}</label>${c}</div>`;
    }).join("");

    $("recordDialog").showModal();
  }

  function closeForm() {
    $("recordDialog").close();
    formType = "";
    editId = null;
  }

  function saveForm(e) {
    e.preventDefault();

    let cfg = configs[formType];
    if (!cfg || !can(cfg.perm)) return;

    $("formError").textContent = "";

    let fd = new FormData($("recordForm")),
      r = {};

    cfg.fields.forEach(([k]) => {
      r[k] = String(fd.get(k) || "").trim();
    });

    if (formType !== "patient") {
      let p = CareBackend.patient(r.patientId);

      if (!p || p.consent !== "Granted") {
        $("formError").textContent =
          "à¤‡à¤¸ à¤®à¤°à¥€à¤œ à¤•à¤¾ consent Granted à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤ à¤ªà¤¹à¤²à¥‡ consent/access à¤•à¥€ à¤ªà¥à¤·à¥à¤Ÿà¤¿ à¤•à¤°à¥‡à¤‚à¥¤";
        return;
      }
    }

    if (editId) r.id = editId;

    // Corrected: keep the original patient collection mapping intact.
    let store = {
      patient: "patients",
      task: "tasks",
      appointment: "appointments",
      referral: "referrals",
      lab: "labs"
    }[formType];

    CareBackend.save(store, r);
    closeForm();
      CareWorkflows.scan();
      renderAll();
    toast("Record save à¤¹à¥‹ à¤—à¤¯à¤¾à¥¤");
  }

  function doAction(act, id) {
    const m = {
      "edit-patient": ["patients", "patient", "patients"],
      "edit-task": ["tasks", "task", "tasks"],
      "edit-appointment": ["appointments", "appointment", "appointments"],
      "edit-referral": ["referrals", "referral", "referrals"],
      "edit-lab": ["labs", "lab", "labs"]
    };

    if (m[act]) {
      let [store, type, perm] = m[act];
      if (!can(perm)) return toast("Permission denied");
      openForm(type, CareBackend.get(store, id));
      return;
    }

    try {
      switch (act) {
        case "complete-task":
          if (!can("tasks")) throw Error("Permission denied");
          CareBackend.update("tasks", id, {
            status: "Completed",
            completedAt: new Date().toISOString()
          });
          break;

        case "escalate-task":
          if (!can("escalate")) throw Error("Permission denied");
          CareBackend.update("tasks", id, { status: "Escalated" });
          break;

        case "confirm-appointment":
          if (!can("appointments")) throw Error("Permission denied");
          CareBackend.update("appointments", id, { status: "Confirmed" });
          break;

        case "complete-appointment":
          if (!can("appointments")) throw Error("Permission denied");
          CareBackend.update("appointments", id, { status: "Completed" });
          break;

        case "send-referral":
          if (!can("referrals")) throw Error("Permission denied");
          CareBackend.update("referrals", id, {
            status: "Sent",
            date: today()
          });
          break;

        case "accept-referral":
          if (!can("referrals")) throw Error("Permission denied");
          CareBackend.update("referrals", id, { status: "Accepted" });
          break;

        case "complete-referral":
          if (!can("referrals")) throw Error("Permission denied");
          CareBackend.update("referrals", id, { status: "Completed" });
          break;

        case "complete-lab":
          if (!can("labs")) throw Error("Permission denied");
          CareBackend.update("labs", id, { status: "Completed" });
          break;

        case "resolve-alert":
          if (!can("escalate")) throw Error("Permission denied");
          CareBackend.update("alerts", id, {
            status: "Resolved",
            resolvedAt: new Date().toISOString()
          });
          break;

        case "reopen-alert":
          if (!can("escalate")) throw Error("Permission denied");
          CareBackend.update("alerts", id, { status: "Open" });
          break;

        case "open-alert": {
          let a = CareBackend.get("alerts", id);
          go(({ tasks: "tasks", appointments: "appointments", referrals: "referrals", labs: "labs", patients: "patients" })[a?.sourceType] || "patients");
          break;
        }

        case "patient-tasks": {
          let p = CareBackend.patient(id);
          $("taskSearch").value = p?.name || "";
          go("tasks");
          renderTasks();
          return;
        }

        case "goto-task":
          $("taskSearch").value = id;
          go("tasks");
          renderTasks();
          return;
      }
      CareWorkflows.scan();
      renderAll();
      toast("Action processed.");
    } catch (e) {
      toast(e.message || "Action failed");
    }
  }

  function exportJSON() {
    if (!can("export")) return toast("à¤‡à¤¸ role à¤•à¥‹ export à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤");

    let blob = new Blob(
        [JSON.stringify(CareBackend.exportData(), null, 2)],
        { type: "application/json" }
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");

    a.href = url;
    a.download = "caremesh-demo-export.json";
    a.click();
    URL.revokeObjectURL(url);

    CareBackend.log("Exported", "demo", "JSON export downloaded");
    renderActivity();
  }

  document.addEventListener("click", e => {
    let n = e.target.closest("[data-page]");
    if (n) {
      go(n.dataset.page);
      return;
    }

    let g = e.target.closest("[data-goto]");
    if (g) {
      go(g.dataset.goto);
      return;
    }

    let f = e.target.closest("[data-form]");
    if (f) {
      openForm(f.dataset.form);
      return;
    }

    let a = e.target.closest("[data-action]");
    if (a) doAction(a.dataset.action, a.dataset.id);
  });

  $("roleSelect").addEventListener("change", () => {
    CareBackend.log("Changed demo role", "permissions", CareSecurity.label());
    renderAll();
    toast("Demo role à¤¬à¤¦à¤²à¤¾ à¤¹à¥ˆ; à¤¯à¤¹ à¤…à¤¸à¤²à¥€ login à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤");
  });

  [
    ["patientSearch", renderPatients],
    ["patientConsent", renderPatients],
    ["taskSearch", renderTasks],
    ["taskStatus", renderTasks],
    ["taskPriority", renderTasks],
    ["appointmentSearch", renderAppointments],
    ["appointmentStatus", renderAppointments],
    ["referralSearch", renderReferrals],
    ["referralStatus", renderReferrals],
    ["labSearch", renderLabs],
    ["labStatus", renderLabs]
  ].forEach(([id, fn]) => $(id).addEventListener("input", fn));

  $("recordForm").addEventListener("submit", saveForm);
  $("closeDialog").addEventListener("click", closeForm);
  $("cancelDialog").addEventListener("click", closeForm);

  function scan() {
      CareWorkflows.scan();
      renderAll();
    toast("Checks complete â€” alerts à¤•à¥‹ review à¤•à¤°à¥‡à¤‚à¥¤");
  }

  $("scanBtn").addEventListener("click", scan);
  $("scanBtn2").addEventListener("click", scan);
  $("quickAdd").addEventListener("click", () => openForm("task"));
  $("exportBtn").addEventListener("click", exportJSON);
  $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  CareBackend.initialize().finally(() => {
    CareWorkflows.scan();
    renderAll();
  });
})();
