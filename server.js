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

// Improved JSON extraction function
const extractJSON = (text) => {
  try {
    // Remove markdown code blocks
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    // Remove any leading/trailing text and extract JSON object
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }
    
    return text.trim();
  } catch (e) {
    return text;
  }
};

// LLM validation function using GROQ API - FIXED
const validateWithLLM = async (pdfText, rule) => {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('Groq API key not configured in .env file');
  }

  console.log(`\n🔍 Validating rule: "${rule}"`);
  console.log(`📝 PDF text length: ${pdfText.length} characters`);

  const systemPrompt = `You are a document validation assistant. You MUST respond with ONLY a JSON object, nothing else.
The JSON must have exactly these fields:
- status: either "pass" or "fail"
- evidence: a relevant quote from the document
- reasoning: brief explanation
- confidence: a number between 0-100

Example response format:
{"status":"pass","evidence":"The document states 'Purpose: To establish guidelines'","reasoning":"Document contains a clear purpose statement","confidence":95}`;

  const userPrompt = `Check if this document meets the rule: "${rule}"

Document text (first 4000 characters):
${pdfText.substring(0, 4000)}

Respond with ONLY the JSON object, no other text.`;

  try {
    console.log('📡 Sending request to Groq API...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Groq API Error:', errorData);
      throw new Error(`Groq API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ Received response from Groq');
    
    if (!data.choices || !data.choices[0]) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response structure from Groq');
    }

    let content = data.choices[0].message.content.trim();
    console.log('📄 Raw response:', content);
    
    // Extract and clean JSON
    content = extractJSON(content);
    console.log('🔧 Cleaned response:', content);
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('📄 Content that failed to parse:', content);
      
      // Last resort: try to create a valid response from the text
      return {
        rule: rule,
        status: 'fail',
        evidence: 'Unable to parse LLM response',
        reasoning: `Parse error: ${parseError.message}. Raw content: ${content.substring(0, 100)}`,
        confidence: 0
      };
    }
    
    // Validate and normalize fields with better fallbacks
    const status = String(result.status || result.Status || 'fail').toLowerCase();
    const evidence = String(result.evidence || result.Evidence || result.quote || 'No evidence provided').substring(0, 200);
    const reasoning = String(result.reasoning || result.Reasoning || result.reason || 'No reasoning provided').substring(0, 200);
    const confidenceRaw = result.confidence || result.Confidence || result.score || 50;
    const confidence = Math.min(100, Math.max(0, parseInt(confidenceRaw)));
    
    // Ensure status is valid
    const validStatus = (status === 'pass' || status === 'fail') ? status : 'fail';
    
    console.log(`✅ Validation result: ${validStatus.toUpperCase()} (${confidence}%)`);
    
    return {
      rule: rule,
      status: validStatus,
      evidence: evidence,
      reasoning: reasoning,
      confidence: confidence
    };
  } catch (error) {
    console.error('❌ LLM Error:', error.message);
    
    // Provide more specific error information
    if (error.message.includes('401')) {
      throw new Error('Invalid API key');
    } else if (error.message.includes('429')) {
      throw new Error('Rate limit exceeded');
    } else if (error.message.includes('quota')) {
      throw new Error('API quota exceeded');
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
      
      // Add delay between requests
      if (i < parsedRules.length - 1) {
        console.log('⏳ Waiting 1 second before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('⚠️ File cleanup error:', err);
    });

    console.log('\n✅ Validation complete!');
    console.log(`📊 Results: ${results.filter(r => r.status === 'pass').length} passed, ${results.filter(r => r.status === 'fail').length} failed, ${results.filter(r => r.status === 'error').length} errors`);
    
    res.json({ results });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const apiKeyConfigured = !!process.env.GROQ_API_KEY;
  res.json({ 
    status: 'ok', 
    message: 'Server is running with Groq API',
    apiKeyConfigured: apiKeyConfigured 
  });
});

// Test API key endpoint
app.get('/api/test-key', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return res.json({ 
      valid: false, 
      error: 'Groq API key not configured in .env file' 
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ 
        valid: true, 
        message: 'Groq API key is valid and working!',
        availableModels: data.data?.map(m => m.id).slice(0, 5) || []
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
  console.log(`🚀 Using Groq API (FREE & FAST)`);
  console.log(`🤖 Model: llama-3.3-70b-versatile`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🔑 Groq API Key configured: ${!!process.env.GROQ_API_KEY}`);
  console.log(`🧪 Test API key: http://localhost:${PORT}/api/test-key`);
  console.log(`${'='.repeat(50)}\n`);
});
