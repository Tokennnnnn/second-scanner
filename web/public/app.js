// Aegis Web Dashboard Client Script

document.addEventListener("DOMContentLoaded", () => {
  loadSignatures();
  loadLiveReports();

  // Poll live reports every 5 seconds
  setInterval(loadLiveReports, 5000);

  setupDropZone();

  // PIN Lookup event
  const lookupBtn = document.getElementById("lookupBtn");
  const pinInput = document.getElementById("pinInput");
  if (lookupBtn && pinInput) {
    lookupBtn.addEventListener("click", () => filterReportsByPin(pinInput.value.trim()));
    pinInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") filterReportsByPin(pinInput.value.trim());
    });
  }
});

let cachedReports = [];

async function filterReportsByPin(pin) {
  if (!pin) {
    renderReports(cachedReports);
    return;
  }
  const filtered = cachedReports.filter(r => (r.Pin && r.Pin.toLowerCase().includes(pin.toLowerCase())) || (r.ScanId && r.ScanId.toLowerCase().includes(pin.toLowerCase())));
  renderReports(filtered);
}

async function loadSignatures() {
  const tbody = document.getElementById("rulesBody");
  const countEl = document.getElementById("ruleCount");

  try {
    const res = await fetch("/api/signatures");
    if (!res.ok) throw new Error("Failed to load signatures");
    const rules = await res.json();

    countEl.textContent = rules.length;
    if (rules.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">No signatures loaded. Ingest targets below.</td></tr>`;
      return;
    }

    tbody.innerHTML = rules.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td><code>${escapeHtml(r.original_file_name || 'N/A')}</code></td>
        <td><code>${escapeHtml(r.imphash ? r.imphash.substring(0, 16) + '...' : 'N/A')}</code></td>
        <td><code>${escapeHtml(r.rich_hash ? r.rich_hash.substring(0, 16) + '...' : 'N/A')}</code></td>
        <td><span class="badge-sev sev-high">${escapeHtml(r.severity || 'HIGH')}</span></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">Rule repository ready. Local mode active.</td></tr>`;
  }
}

async function loadLiveReports() {
  try {
    const res = await fetch("/api/report");
    if (!res.ok) return;
    const reports = await res.json();
    cachedReports = reports || [];
    renderReports(cachedReports);
  } catch (err) {
    // offline or static mode
  }
}

function renderReports(reports) {
  const container = document.getElementById("liveReports");
  if (!reports || reports.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching client audit reports found.</div>`;
    return;
  }

  container.innerHTML = reports.map(rep => {
    const isClean = !rep.Findings || rep.Findings.length === 0;
    const statusClass = isClean ? "clean" : "detected";
    const verdictText = isClean
      ? `<span class="verdict-clean">&#x2714; VERIFIED CLEAN</span>`
      : `<span class="verdict-detected">&#x26A0; DETECTED (${rep.Findings.length} FINDINGS)</span>`;

    return `
      <div class="report-card ${statusClass}">
        <div class="report-header">
          <div class="report-verdict">${verdictText}</div>
          <div style="font-family: var(--font-mono); font-size:0.85rem; color:#888;">
            ${rep.Pin ? `<strong style="color:var(--accent-cyan); margin-right:12px;">PIN: [ ${rep.Pin.split('').join(' ')} ]</strong>` : ''}
            Host: ${escapeHtml(rep.MachineName)} // User: ${escapeHtml(rep.UserName)} // ${new Date(rep.StartTime).toLocaleTimeString()}
          </div>
        </div>
        <div style="font-size:0.9rem; color:#ccc;">
          Processes: ${rep.TotalProcessesScanned} | Files: ${rep.TotalFilesScanned} | Forensics: ${rep.TotalForensicArtifactsScanned}
        </div>
        ${!isClean ? `
          <div style="margin-top:10px; padding:8px; background:rgba(255,51,102,0.08); border-radius:4px; font-family:var(--font-mono); font-size:0.8rem; color:#ff99aa;">
            ${rep.Findings.map(f => `<div>&bull; [${escapeHtml(f.Severity)}] ${escapeHtml(f.RuleName)} (${escapeHtml(f.ArtifactType)}) - ${escapeHtml(f.ItemPath)}</div>`).join("")}
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function setupDropZone() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const statusBox = document.getElementById("uploadStatus");

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (fileInput.files.length > 0) {
      handleUpload(fileInput.files[0]);
    }
  });

  async function handleUpload(file) {
    statusBox.className = "status-box";
    statusBox.textContent = `Analyzing and hashing ${file.name}...`;
    statusBox.classList.remove("hidden");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64: base64,
            ruleName: file.name.replace(/\.[^/.]+$/, "")
          })
        });

        const data = await res.json();
        if (data.success) {
          statusBox.className = "status-box success";
          statusBox.textContent = `[+] Invariant signature generated for ${file.name}! Added to live catalog.`;
          loadSignatures();
        } else {
          statusBox.className = "status-box error";
          statusBox.textContent = `[-] Ingestion error: ${data.error || 'Failed'}`;
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      statusBox.className = "status-box error";
      statusBox.textContent = `[-] Ingestion failed: ${err.message}`;
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
