// Vercel Serverless Function: POST /api/upload
const crypto = require("crypto");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, fileBase64, ruleName } = req.body;
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: "Missing file content." });
    }

    const fileBuffer = Buffer.from(fileBase64, "base64");
    const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const md5 = crypto.createHash("md5").update(fileBuffer).digest("hex");

    const rule = {
      id: "RULE-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
      name: ruleName || fileName.replace(/\.[^/.]+$/, ""),
      description: `Uploaded signature for ${fileName}`,
      original_file_name: fileName,
      created_at: new Date().toISOString(),
      file_sha256: sha256,
      file_md5: md5,
      severity: "High",
      min_confidence_score: 60,
      sections: [],
      required_strings: []
    };

    return res.status(200).json({
      success: true,
      message: `Signature created for ${fileName}`,
      rule
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
