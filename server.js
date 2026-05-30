const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let leads = [];

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "AI Business Automation Server Running"
  });
});

app.post("/api/lead", (req, res) => {
  const { name, phone, message } = req.body;

  const lead = {
    id: Date.now(),
    name,
    phone,
    message,
    createdAt: new Date()
  };

  leads.push(lead);

  res.json({
    success: true,
    lead
  });
});

app.get("/api/leads", (req, res) => {
  res.json(leads);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
