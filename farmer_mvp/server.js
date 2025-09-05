// server.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const FAQ_FILE = path.join(DATA_DIR, 'faq.json');
const QUERIES_FILE = path.join(DATA_DIR, 'queries.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data files exist (creates sample if missing)
async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FAQ_FILE);
  } catch {
    const sample = [
      {"id":1,"question":"How often should I water wheat?","answer":"Wheat irrigation depends on soil and stage — generally check soil moisture and aim for 7–10 day intervals in dry spells.","crop":"Wheat","tags":"irrigation"},
      {"id":2,"question":"How to control aphids on cotton?","answer":"Try neem oil spray, insecticidal soap, or natural predators like ladybugs; avoid heavy spraying during flowering.","crop":"Cotton","tags":"pest"},
      {"id":3,"question":"When to harvest rice?","answer":"Harvest when grains are hard and have yellow/brown color; check moisture content with local lab or dryer.","crop":"Rice","tags":"harvest"},
      {"id":4,"question":"How to test soil pH?","answer":"Use a home pH test kit or take a sample to a local agricultural lab (Krishi Vigyan Kendra).","crop":"All","tags":"soil"},
      {"id":5,"question":"Where to sell crops near me?","answer":"Check nearest mandi prices and the e-NAM platform; compare buyers before selling.","crop":"All","tags":"market"}
    ];
    await fs.writeFile(FAQ_FILE, JSON.stringify(sample, null, 2), 'utf8');
  }
  try {
    await fs.access(QUERIES_FILE);
  } catch {
    await fs.writeFile(QUERIES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

ensureFiles().catch(console.error);

// API: return FAQ
app.get('/api/faq', async (req, res) => {
  try {
    const data = await fs.readFile(FAQ_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: 'Could not read FAQ' });
  }
});

// API: save query for expert review
app.post('/api/queries', async (req, res) => {
  try {
    const { question, metadata } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });
    const content = await fs.readFile(QUERIES_FILE, 'utf8');
    const arr = JSON.parse(content);
    const entry = { id: Date.now(), question, metadata: metadata || '', timestamp: new Date().toISOString() };
    arr.push(entry);
    await fs.writeFile(QUERIES_FILE, JSON.stringify(arr, null, 2), 'utf8');
    res.json({ status: 'saved' });
  } catch (e) {
    res.status(500).json({ error: 'Could not save query' });
  }
});

// Admin API: add FAQ (very simple password check: 'admin')
app.post('/api/faq', async (req, res) => {
  try {
    const { password, question, answer, crop, tags } = req.body;
    if (password !== 'admin') return res.status(403).json({ error: 'invalid password' });
    if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });
    const content = await fs.readFile(FAQ_FILE, 'utf8');
    const arr = JSON.parse(content);
    const newId = arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
    const newRow = { id: newId, question, answer, crop: crop || 'All', tags: tags || '' };
    arr.push(newRow);
    await fs.writeFile(FAQ_FILE, JSON.stringify(arr, null, 2), 'utf8');
    res.json({ status: 'ok', newRow });
  } catch (e) {
    res.status(500).json({ error: 'Could not add FAQ' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
