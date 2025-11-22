# PDF Document Validator

A full-stack web application that validates PDF documents against user-defined rules using AI/LLM validation powered by Groq's free API.

## 🚀 Features

- 📄 Upload PDF files (2-10 pages)
- ✍️ Define 3 custom validation rules in natural language
- 🤖 AI-powered validation using Groq's Llama 3.3 70B model
- 📊 Results include: PASS/FAIL status, evidence, reasoning, and confidence scores
- 🎨 Modern black & white design with GTA San Andreas inspired typography
- ⚡ 100% FREE - No credit card required!

## 📁 Project Structure

```
pdf-validator/
├── backend/
│   ├── server.js          # Express server with Groq API integration
│   ├── package.json       # Node.js dependencies
│   ├── .env              # Environment variables (Groq API key)
│   └── uploads/          # Temporary PDF storage (auto-created)
├── frontend/
│   └── index.html        # Complete frontend (HTML + CSS + JS)
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with GTA-inspired design
- **Vanilla JavaScript** - No frameworks, pure JS

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **dotenv** - Environment configuration

### AI/LLM
- **Groq API** - FREE & FAST AI inference
- **Model:** Llama 3.3 70B Versatile
- **Cost:** $0 (completely free!)

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Python** (for serving frontend) - [Download](https://www.python.org/downloads/)
- **Groq API Key** (free) - [Get yours](https://console.groq.com/)

## 🔧 Installation & Setup

### Step 1: Get Your Free Groq API Key

1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up for a free account (no credit card needed)
3. Navigate to **API Keys** section
4. Click **"Create API Key"**
5. Copy your API key (starts with `gsk_`)

### Step 2: Create Project Structure

Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux):

```cmd
cd Desktop
mkdir pdf-validator
cd pdf-validator
mkdir backend
mkdir frontend
```

### Step 3: Setup Backend

1. **Navigate to backend folder:**
   ```cmd
   cd backend
   ```

2. **Place downloaded backend files:**
   - `server.js` → Place in `backend/` folder
   - `package.json` → Place in `backend/` folder

3. **Create `.env` file:**
   
   Create a new file named `.env` in the `backend` folder with this content:
   
   ```
   GROQ_API_KEY=your-groq-api-key-here
   PORT=5000
   ```
   
   Replace `your-groq-api-key-here` with your actual Groq API key from Step 1.

4. **Install dependencies:**
   ```cmd
   npm install
   ```

### Step 4: Setup Frontend

1. **Navigate to frontend folder:**
   ```cmd
   cd ..\frontend
   ```

2. **Place the HTML file:**
   - Save `index.html` to the `frontend/` folder

## ▶️ Running the Application

You need to run **TWO separate command prompt/terminal windows**:

### Terminal 1 - Backend Server

```cmd
cd Desktop\pdf-validator\backend
npm start
```

**Expected output:**
```
==================================================
✅ Server running on http://localhost:5000
🚀 Using Groq API (FREE & FAST)
🤖 Model: llama-3.3-70b-versatile
📁 Upload directory: C:\Users\...\backend\uploads
🔑 Groq API Key configured: true
🧪 Test API key: http://localhost:5000/api/test-key
==================================================
```

### Terminal 2 - Frontend Server

Open a **NEW** Command Prompt/Terminal window:

```cmd
cd Desktop\pdf-validator\frontend
python -m http.server 3000
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

### Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## 📝 How to Use

### 1. Upload a PDF
- Click the upload area or drag-and-drop your PDF file
- Supports PDF files between 2-10 pages

### 2. Define 3 Validation Rules

Enter rules in natural language. Examples:

**Rule 1:**
```
The document must have a purpose section.
```

**Rule 2:**
```
The document must mention at least one date.
```

**Rule 3:**
```
The document must define at least one term.
```

### More Example Rules:
- "The document must mention who is responsible."
- "The document must list any requirements."
- "The document must include contact information."
- "The document must have a conclusion section."
- "The document must reference external sources."

### 3. Click "CHECK DOCUMENT"

Wait 10-15 seconds for AI analysis (processes 3 rules with 1 second delay between each).

### 4. View Results

Results table shows for each rule:
- ✅ **Status**: PASS, FAIL, or ERROR
- 📄 **Evidence**: Relevant quote from the document
- 💭 **Reasoning**: AI's explanation
- 📊 **Confidence**: 0-100% confidence score

## 🎨 Design Features

### Visual Design
- **Color Scheme**: Bold black & white high contrast
- **Typography**: Bebas Neue (GTA San Andreas inspired) + Roboto
- **Layout**: Sharp edges, no rounded corners, bold 4px borders
- **Effects**: Text shadows, hover animations, smooth transitions

### UI/UX
- Responsive design (works on mobile and desktop)
- Clear visual feedback on all interactions
- Loading spinner during processing
- Error messages with clear explanations
- Professional table layout for results

## 🔐 Security & Privacy

- ✅ API key stored in `.env` file (not in code)
- ✅ Files automatically deleted after processing
- ✅ Only PDF files accepted
- ✅ File size validation
- ✅ CORS enabled for localhost only

## 🐛 Troubleshooting

### "npm is not recognized"
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/) and restart Command Prompt

### "python is not recognized"
**Solution:** Install Python from [python.org](https://www.python.org/downloads/) and check "Add Python to PATH" during installation

### Port 5000 already in use
**Solution:** 
1. Change `PORT=5000` to `PORT=5001` in `.env` file
2. Update frontend `index.html` line 621: change `http://localhost:5000` to `http://localhost:5001`

### API Key Errors
**Solution:** 
1. Verify your Groq API key in `.env` file
2. Test your key at: `http://localhost:5000/api/test-key`
3. Ensure no extra spaces or quotes around the key

### "Invalid LLM response" or JSON parsing errors
**Solution:** This is already fixed in the latest `server.js` version. Ensure you're using the most recent code.

### Rate limit exceeded
**Solution:** Groq free tier has rate limits. Wait 60 seconds and try again.

## 📦 Dependencies

### Backend Dependencies
```json
{
  "express": "^4.18.2",      // Web framework
  "multer": "^1.4.5-lts.1",  // File upload handling
  "cors": "^2.8.5",          // Cross-origin requests
  "pdf-parse": "^1.1.1",     // PDF text extraction
  "dotenv": "^16.3.1"        // Environment variables
}
```

### Frontend Dependencies
- No external dependencies (vanilla JavaScript)
- Google Fonts: Bebas Neue, Roboto

## 🌟 Why Groq?

| Feature | OpenAI | Groq |
|---------|--------|------|
| **Cost** | Paid ($0.002/request) | **FREE** |
| **Speed** | ~3-5 seconds | **1-2 seconds** |
| **Setup** | Credit card required | Email only |
| **Quota** | Limited by billing | Generous free tier |
| **Quality** | GPT-3.5 | Llama 3.3 70B (comparable) |

## 📊 Example Result Format

```json
{
  "rule": "The document must have a purpose section.",
  "status": "pass",
  "evidence": "Purpose: This document serves as a comprehensive guide for software development",
  "reasoning": "Document clearly contains a dedicated purpose section at the beginning",
  "confidence": 95
}
```

## 🔄 API Endpoints

### POST `/api/validate`
Validates PDF against rules
- **Input**: PDF file + 3 rules (form-data)
- **Output**: JSON with validation results

### GET `/api/health`
Health check endpoint
- **Output**: Server status and API key configuration

### GET `/api/test-key`
Tests if Groq API key is valid
- **Output**: Validation status and available models

## 📝 Example Test Scenario

1. **Upload:** `sample-document.pdf`
2. **Rules:**
   - "The document must have a purpose section." → ✅ PASS (95%)
   - "The document must mention at least one date." → ✅ PASS (92%)
   - "The document must define at least one term." → ✅ PASS (90%)

## 🚀 Advanced Usage

### Custom Model Selection
Edit `server.js` line 119 to use different Groq models:
```javascript
model: 'llama-3.3-70b-versatile',  // Current (recommended)
// model: 'llama-3.2-90b-text-preview',  // Alternative
// model: 'mixtral-8x7b-32768',  // Faster, less accurate
```

### Adjust AI Temperature
Edit `server.js` line 127 to change AI creativity:
```javascript
temperature: 0.2,  // Lower = more consistent, Higher = more creative
```

## 📄 License

ISC

## 👨‍💻 Author

Created for **NIYAMR AI Full-Stack Developer Assignment**

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Test your API key: `http://localhost:5000/api/test-key`
3. Check CMD/Terminal logs for detailed error messages
4. Verify `.env` file format (no quotes, no spaces)

## ⚠️ Important Notes

- Your Groq API key is **FREE** and has no quota limits for personal use
- Files are automatically deleted after processing (not stored)
- The system uses the first 4000 characters of each PDF
- Processing takes ~3-5 seconds per rule (1 second delay between requests)
- Works best with well-structured PDF documents

## 🎯 Assignment Compliance

This project fulfills all NIYAMR AI assignment requirements:

✅ **Upload PDF** - Fully functional with drag-and-drop  
✅ **3 Rules** - User can enter any validation rules  
✅ **LLM Integration** - Groq API with Llama 3.3 70B  
✅ **Pass/Fail Status** - Clear status for each rule  
✅ **Evidence** - Exact quotes from document  
✅ **Reasoning** - AI explanation of decision  
✅ **Confidence Score** - 0-100% accuracy estimate  
✅ **Frontend** - Modern, responsive UI  
✅ **Backend** - Express server with proper error handling  

---

**Ready to validate documents with AI? Start the servers and visit http://localhost:3000!** 🚀
