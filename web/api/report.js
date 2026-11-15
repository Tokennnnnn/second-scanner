// Vercel Serverless Function: GET / POST /api/report
let latestReports = [];

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json(latestReports);
  }

  if (req.method === "POST") {
    try {
      const report = req.body;
      if (!report || !report.ScanId) {
        return res.status(400).json({ error: "Invalid scan report object." });
      }

      // Add to front of history, keep latest 50 reports
      latestReports.unshift(report);
      if (latestReports.length > 50) {
        latestReports.pop();
      }

      return res.status(200).json({ success: true, scanId: report.ScanId, findings: report.Findings ? report.Findings.length : 0 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
