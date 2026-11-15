// Vercel Serverless Function: GET / POST /api/signatures
let inMemorySignatures = [
  {
    "id": "RULE-DEFAULT-01",
    "name": "TargetLoader",
    "description": "Invariant PE signature rule for unauthorized loader module",
    "original_file_name": "loader.exe",
    "created_at": new Date().toISOString(),
    "imphash": "53e4e12437621212a425d294842d0a96",
    "rich_hash": "269e68923530284f3920bea0c15241b2",
    "severity": "High",
    "min_confidence_score": 60,
    "sections": [
      { "name": ".text", "sha256": "31668f1e4ef3fb01840abf7e71ece5aa8ba04ec54716bd2aea9a503593c642cd" },
      { "name": ".rdata", "sha256": "8ded3041e47589d7da33439e4dfbdd325134e97de7c3eceed61319d8a7368e03" }
    ],
    "required_strings": ["VirtualProtect", "WriteProcessMemory", "CreateRemoteThread"]
  }
];

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json(inMemorySignatures);
  }

  if (req.method === "POST") {
    try {
      const newRule = req.body;
      if (!newRule || !newRule.name) {
        return res.status(400).json({ error: "Invalid signature rule payload." });
      }

      // Check if rule already exists and update
      const existingIdx = inMemorySignatures.findIndex(r => r.name.toLowerCase() === newRule.name.toLowerCase());
      if (existingIdx >= 0) {
        inMemorySignatures[existingIdx] = newRule;
      } else {
        inMemorySignatures.push(newRule);
      }

      return res.status(200).json({ success: true, count: inMemorySignatures.length, rule: newRule });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
