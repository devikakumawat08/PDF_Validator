const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('../frontend'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// PDF text extraction function
const extractPdfText = async (filePath) => {
  const pdfParse = require('pdf-parse');
  const pdfBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(pdfBuffer);
  return data.text;
};

// LLM validation function using OpenAI
const validateWithLLM = async (pdfText, rule) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a document validator. Analyze the following PDF text and check if it meets this rule:

RULE: "${rule}"

PDF TEXT:
${pdfText.substring(0, 3000)}

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "status": "pass" or "fail",
  "evidence": "A single relevant sentence from the document",
  "reasoning": "Brief explanation of your decision",
  "confidence": 0-100
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid LLM response');
    }

    const content = data.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const result = JSON.parse(cleanContent);
    
    return {
      rule: rule,
      status: result.status.toLowerCase(),
      evidence: result.evidence,
      reasoning: result.reasoning,
      confidence: parseInt(result.confidence)
    };
  } catch (error) {
    console.error('LLM Error:', error);
    throw error;
  }
};

// Validation endpoint
app.post('/api/validate', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    const { rules } = req.body;
    if (!rules || rules.length === 0) {
      return res.status(400).json({ error: 'No validation rules provided' });
    }

    const parsedRules = JSON.parse(rules);

    // Extract PDF text
    console.log('Extracting PDF text...');
    const pdfText = await extractPdfText(req.file.path);
    console.log(`Extracted ${pdfText.length} characters from PDF`);

    // Validate each rule
    const results = [];
    for (const rule of parsedRules) {
      try {
        console.log(`Validating rule: ${rule}`);
        const result = await validateWithLLM(pdfText, rule);
        results.push(result);
      } catch (error) {
        console.error(`Error validating rule "${rule}":`, error);
        results.push({
          rule: rule,
          status: 'error',
          evidence: 'N/A',
          reasoning: error.message,
          confidence: 0
        });
      }
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File cleanup error:', err);
    });

    res.json({ results });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
});
