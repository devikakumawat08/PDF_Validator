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

// LLM validation function using OpenAI - FIXED VERSION
const validateWithLLM = async (pdfText, rule) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured in .env file');
  }

  console.log(`\n🔍 Validating rule: "${rule}"`);
  console.log(`📝 PDF text length: ${pdfText.length} characters`);

  const prompt = `You are a document validator. Analyze the following PDF text and check if it meets this rule:

RULE: "${rule}"

PDF TEXT:
${pdfText.substring(0, 4000)}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks, no extra text):
{"status": "pass", "evidence": "A single relevant sentence from the document", "reasoning": "Brief explanation of your decision", "confidence": 85}`;

  try {
    console.log('📡 Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a document validator. Always respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ Received response from OpenAI');
    
    if (!data.choices || !data.choices[0]) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response structure from OpenAI');
    }

    let content = data.choices[0].message.content.trim();
    console.log('📄 Raw response:', content);
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Try to extract JSON if wrapped in other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    console.log('🔧 Cleaned response:', content);
    
    const result = JSON.parse(content);
    
    // Validate required fields
    if (!result.status || !result.evidence || !result.reasoning || result.confidence === undefined) {
      throw new Error('Missing required fields in LLM response');
    }
    
    console.log(`✅ Validation result: ${result.status.toUpperCase()}`);
    
    return {
      rule: rule,
      status: result.status.toLowerCase(),
      evidence: result.evidence,
      reasoning: result.reasoning,
      confidence: parseInt(result.confidence)
    };
  } catch (error) {
    console.error('❌ LLM Error:', error.message);
    
    // Provide more specific error information
    if (error.message.includes('401')) {
      throw new Error('Invalid API key - Check your OpenAI API key');
    } else if (error.message.includes('429')) {
      throw new Error('Rate limit exceeded - Too many requests');
    } else if (error.message.includes('insufficient_quota')) {
      throw new Error('Insufficient credits - Add credits to your OpenAI account');
    } else {
      throw error;
    }
  }
};

// Validation endpoint
app.post('/api/validate', upload.single('pdf'), async (req, res) => {
  try {
    console.log('\n📥 Received validation request');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    console.log(`📄 File: ${req.file.originalname} (${req.file.size} bytes)`);

    const { rules } = req.body;
    if (!rules || rules.length === 0) {
      return res.status(400).json({ error: 'No validation rules provided' });
    }

    const parsedRules = JSON.parse(rules);
    console.log(`📋 Rules to validate: ${parsedRules.length}`);

    // Extract PDF text
    console.log('🔍 Extracting PDF text...');
    const pdfText = await extractPdfText(req.file.path);
    console.log(`✅ Extracted ${pdfText.length} characters from PDF`);

    // Validate each rule
    const results = [];
    for (let i = 0; i < parsedRules.length; i++) {
      const rule = parsedRules[i];
      console.log(`\n--- Rule ${i + 1}/${parsedRules.length} ---`);
      
      try {
        const result = await validateWithLLM(pdfText, rule);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error validating rule "${rule}":`, error.message);
        results.push({
          rule: rule,
          status: 'error',
          evidence: 'N/A',
          reasoning: error.message,
          confidence: 0
        });
      }
      
      // Add a small delay between requests to avoid rate limits
      if (i < parsedRules.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('⚠️ File cleanup error:', err);
    });

    console.log('\n✅ Validation complete!');
    res.json({ results });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const apiKeyConfigured = !!process.env.OPENAI_API_KEY;
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    apiKeyConfigured: apiKeyConfigured 
  });
});

// Test API key endpoint
app.get('/api/test-key', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.json({ 
      valid: false, 
      error: 'API key not configured in .env file' 
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      res.json({ 
        valid: true, 
        message: 'API key is valid and working!' 
      });
    } else {
      const error = await response.json();
      res.json({ 
        valid: false, 
        error: error.error?.message || 'Invalid API key' 
      });
    }
  } catch (error) {
    res.json({ 
      valid: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🔑 API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`🧪 Test API key: http://localhost:${PORT}/api/test-key`);
  console.log(`${'='.repeat(50)}\n`);
});
