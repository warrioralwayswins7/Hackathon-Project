
(() => {
  const $ = id => document.getElementById(id);

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);

  const today = () => new Date().toISOString().slice(0, 10);

  function list(name) {
    try {
      return CareBackend.list(name) || [];
    } catch (error) {
      console.error("Reports could not load:", name, error);
      return [];
    }
  }

  function statusCounts(records) {
    const counts = {};
    records.forEach(record => {
      const status = record.status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }

  function statusHTML(records) {
    const counts = statusCounts(records);
    const entries = Object.entries(counts);

    if (!entries.length) {
      return '<p class="empty">No records available.</p>';
    }

    return entries.map(([status, count]) => `
      <div class="break-row">
        <div>
          <span>${esc(status)}</span>
          <b>${count}</b>
        </div>
        <div class="bar">
          <span style="width:${
            records.length ? count / records.length * 100 : 0
          }%"></span>
        </div>
      </div>
    `).join("");
  }

  function renderReports() {
    const stats = $("reportStats");
    if (!stats) return;

    const patients = list("patients");
    const tasks = list("tasks");
    const appointments = list("appointments");
    const referrals = list("referrals");
    const labs = list("labs");
    const alerts = list("alerts");

    const openTasks = tasks.filter(
      task => !["Completed", "Cancelled"].includes(task.status)
    );

    const overdueTasks = openTasks.filter(
      task => task.dueDate && task.dueDate < today()
    );

    const completedTasks = tasks.filter(
      task => task.status === "Completed"
    );

    const missedAppointments = appointments.filter(
      appointment => appointment.status === "Missed"
    );

    const cards = [
      ["Total patients", patients.length],
      ["Open tasks", openTasks.length],
      ["Overdue tasks", overdueTasks.length],
      ["Completed tasks", completedTasks.length],
      ["Missed appointments", missedAppointments.length],
      ["Open alerts", alerts.filter(
        alert => alert.status !== "Resolved"
      ).length]
    ];

    stats.innerHTML = cards.map(([label, value]) => `
      <div class="stat">
        <div class="stat-label">${esc(label)}</div>
        <div class="stat-number">${value}</div>
        <div class="stat-foot">Current demo records</div>
      </div>
    `).join("");

    if ($("reportTaskStatus")) {
      $("reportTaskStatus").innerHTML = statusHTML(tasks);
    }

    if ($("reportAppointmentStatus")) {
      $("reportAppointmentStatus").innerHTML =
        statusHTML(appointments);
    }

    if ($("reportReferralStatus")) {
      $("reportReferralStatus").innerHTML = statusHTML(referrals);
    }

    if ($("reportLabStatus")) {
      $("reportLabStatus").innerHTML = statusHTML(labs);
    }

    const rate = tasks.length
      ? Math.round(completedTasks.length / tasks.length * 100)
      : 0;

    if ($("reportSummary")) {
      $("reportSummary").innerHTML = `
        <div class="break-row">
          <div><span>Task completion rate</span><b>${rate}%</b></div>
          <div class="bar"><span style="width:${rate}%"></span></div>
        </div>
        <p><b>Overdue tasks:</b> ${overdueTasks.length}</p>
        <p><b>Missed appointments:</b> ${missedAppointments.length}</p>
        <p><b>Patients with pending consent:</b>
          ${patients.filter(p => p.consent === "Pending").length}
        </p>
        <p><b>Open referrals:</b>
          ${referrals.filter(r => r.status !== "Completed").length}
        </p>
        <p><b>Pending lab/pharmacy items:</b>
          ${labs.filter(l =>
            !["Completed", "Result received"].includes(l.status)
          ).length}
        </p>
      `;
    }
  }

  function downloadCSV() {
    if (typeof CareSecurity !== "undefined" &&
        !CareSecurity.can("export")) {
      if (typeof window.toast === "function") {
        window.toast("इस demo role को export की अनुमति नहीं है।");
      } else {
        alert("इस demo role को export की अनुमति नहीं है।");
      }
      return;
    }

    const groups = [
      ["Patients", list("patients")],
      ["Tasks", list("tasks")],
      ["Appointments", list("appointments")],
      ["Referrals", list("referrals")],
      ["Labs & pharmacy", list("labs")],
      ["Alerts", list("alerts")]
    ];

    const rows = [["Category", "Status", "Count"]];

    groups.forEach(([category, records]) => {
      const counts = statusCounts(records);

      if (!Object.keys(counts).length) {
        rows.push([category, "No records", 0]);
      } else {
        Object.entries(counts).forEach(([status, count]) => {
          rows.push([category, status, count]);
        });
      }
    });

    const csv = rows.map(row =>
      row.map(value =>
        '"' + String(value).replace(/"/g, '""') + '"'
      ).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "caremesh-reports.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function initializeReports() {
    renderReports();

    const exportButton = $("exportReportsBtn");

    if (exportButton &&
        !exportButton.dataset.reportsBound) {
      exportButton.addEventListener("click", downloadCSV);
      exportButton.dataset.reportsBound = "true";
    }
  }

  window.renderCareMeshReports = renderReports;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeReports,
      { once: true }
    );
  } else {
    initializeReports();
  }
})();
