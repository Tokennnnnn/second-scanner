# Deploying Aegis Scanner Portal to Vercel

You can deploy this website to `https://<your-project>.vercel.app` completely free in 2 minutes.

---

### Option 1: Direct Deploy via Vercel Web Dashboard (Easiest)

1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Push or upload this `web/` folder to a GitHub repository (e.g., `my-scanner-portal`).
3. In Vercel, click **Add New... -> Project**, select your GitHub repository, and click **Deploy**.
4. That's it! Your site will be live at `https://your-scanner.vercel.app`.

---

### Option 2: Deploy using Vercel CLI

In your terminal:
```bash
cd web
npx vercel
```
Follow the prompts (accept default settings).

---

### What this Website does:
1. **Download Scanner Button**:
   - Visitors click **Download Scanner (.exe)** to get `AegisScanner.exe`.
   - When the user runs the downloaded `.exe`, it automatically runs the full 4-phase forensic audit immediately with no prompts.
2. **Instant Status Verdict**:
   - **Clean PC**: Bright green banner `[+] STATUS: VERIFIED CLEAN`.
   - **Flagged / Tampered PC**: Bright red banner `[-] STATUS: THREAT DETECTED` with evidence and confidence rating.
3. **Target Ingestion (Upload)**:
   - Drag and drop any `.exe` or `.dll` you want to detect into the upload zone.
   - It extracts the invariant structural fingerprints and adds them to the live rule repository.
4. **Rename-Proof**:
   - Even if suspects rename the target file or delete it before the scan, Imphash, Section Hashes, Rich Header, and BAM/Prefetch traces will flag them!
