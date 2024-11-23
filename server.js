const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://sateeshchowhan:sateesh18@cluster0.fkuss0m.mongodb.net/web-scraper', { useNewUrlParser: true, useUnifiedTopology: true });

// Schema
const InsightSchema = new mongoose.Schema({
  domain: String,
  wordCount: Number,
  webLinks: [String],
  mediaLinks: [String],
  favorite: { type: Boolean, default: false },
});
const Insight = mongoose.model('Insight', InsightSchema);

// Helper Function: Scrape Website Data
const scrapeWebsite = async (url) => {
  const response = await axios.get(url);
  const dom = new JSDOM(response.data);
  const textContent = dom.window.document.body.textContent || '';
  const wordCount = textContent.split(/\s+/).filter((word) => word).length;

  const webLinks = [...dom.window.document.querySelectorAll('a')].map((a) => a.href);
  const mediaLinks = [...dom.window.document.querySelectorAll('img')].map((img) => img.src);

  return { wordCount, webLinks, mediaLinks };
};

// API Routes
app.post('/insights', async (req, res) => {
  const { url } = req.body;
  try {
    const { wordCount, webLinks, mediaLinks } = await scrapeWebsite(url);
    const newInsight = new Insight({ domain: url, wordCount, webLinks, mediaLinks });
    await newInsight.save();
    res.json(newInsight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape website' });
  }
});

app.get('/insights', async (req, res) => {
  const insights = await Insight.find();
  res.json(insights);
});

app.delete('/insights/:id', async (req, res) => {
  await Insight.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted successfully' });
});

app.put('/insights/:id', async (req, res) => {
  const insight = await Insight.findById(req.params.id);
  if (insight) {
    insight.favorite = !insight.favorite;
    await insight.save();
    res.json(insight);
  } else {
    res.status(404).json({ error: 'Insight not found' });
  }
});

// Start Server
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
