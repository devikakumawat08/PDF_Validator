# PDF Document Validator

A full-stack web application that validates PDF documents against user-defined rules using OpenAI's GPT-3.5-turbo model.

## 🚀 Features

- Upload PDF files (2-10 pages)
- Define 3 custom validation rules in natural language
- AI-powered validation using OpenAI LLM
- Results include: PASS/FAIL status, evidence, reasoning, and confidence scores
- Modern black & white design with GTA-inspired typography

## 📁 Project Structure

```
pdf-validator/
├── backend/
│   ├── server.js          # Express server with validation logic
│   ├── package.json       # Node.js dependencies
│   ├── .env              # Environment variables (API key)
│   └── uploads/          # Temporary PDF storage (auto-created)
├── frontend/
│   └── index.html        # Complete frontend (HTML + CSS + JS)
└── README.md
```

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express
- **PDF Processing:** pdf-parse
- **AI:** OpenAI API (GPT-3.5-turbo)
- **Fonts:** Bebas Neue (GTA-style), Roboto

## 📋 Prerequisites

- Node.js (v14 or higher)
- Python (for serving frontend)
- OpenAI API key (already configured)

## 🔧 Installation & Setup

### Step 1: Create Project Structure

```cmd
cd Desktop
mkdir pdf-validator
cd pdf-validator
mkdir backend
mkdir frontend
```

### Step 2: Setup Backend

1. **Navigate to backend folder:**
   ```cmd
   cd backend
   ```

2. **Place downloaded files:**
   - `server.js` → backend folder
   - `package.json` → backend folder
   - Rename `env-file.txt` to `.env` → backend folder

3. **Install dependencies:**
   ```cmd
   npm install
   ```

### Step 3: Setup Frontend

1. **Navigate to frontend folder:**
   ```cmd
   cd ..\frontend
   ```

2. **Place the HTML file:**
   - Save the `index.html` file to frontend folder

## ▶️ Running the Application

### Terminal 1 - Start Backend Server:

```cmd
cd Desktop\pdf-validator\backend
npm start
```

You should see:
```
✅ Server running on http://localhost:5000
📁 Upload directory: C:\Users\...\backend\uploads
```

### Terminal 2 - Start Frontend Server:

Open a new Command Prompt:

```cmd
cd Desktop\pdf-validator\frontend
python -m http.server 3000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

### Access the Application:

Open your browser and go to:
```
http://localhost:3000
```

## 📝 Usage

1. **Upload a PDF** - Click the upload area and select your PDF file
2. **Define 3 Rules** - Enter validation rules in natural language
3. **Click "CHECK DOCUMENT"** - Wait for AI analysis
4. **View Results** - See pass/fail status, evidence, reasoning, and confidence scores

### Example Rules:

- "The document must have a purpose section."
- "The document must mention at least one date."
- "The document must define at least one term."
- "The document must mention who is responsible."
- "The document must list any requirements."

## 🎨 Design Features

- **Black & White Color Scheme** - High contrast, minimalist design
- **GTA-Inspired Typography** - Bebas Neue font for headers
- **Bold Borders** - Sharp, angular elements with no rounded corners
- **Responsive Layout** - Works on desktop and mobile devices
- **Smooth Animations** - Hover effects and transitions

## 📊 API Response Format

```json
{
  "results": [
    {
      "rule": "Document must mention a date.",
      "status": "pass",
      "evidence": "Found in page 1: 'Published 2024'",
      "reasoning": "Document includes a publication year.",
      "confidence": 92
    }
  ]
}
```

## 🔐 Security Notes

- API key is stored in `.env` file (not tracked by git)
- Files are automatically deleted after processing
- Only PDF files are accepted for upload
- CORS enabled for localhost development

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not found | Install Node.js and restart Command Prompt |
| `python` not found | Install Python and check "Add to PATH" |
| Port 5000 in use | Change `PORT=5001` in `.env` file |
| API errors | Verify OpenAI API key is valid and has credits |
| CORS errors | Ensure backend is running on port 5000 |

## 📦 Dependencies

**Backend:**
- express - Web framework
- multer - File upload handling
- cors - Cross-origin resource sharing
- pdf-parse - PDF text extraction
- dotenv - Environment variable management

## 🔄 Updates & Modifications

To modify the design or functionality:
- **Frontend:** Edit `index.html` (all styles and scripts are embedded)
- **Backend:** Edit `server.js`
- **Configuration:** Edit `.env`

## 📄 License

ISC

## 👨‍💻 Author

Created for NIYAMR AI Full-Stack Developer Assignment

---

**Note:** Your OpenAI API key is already configured in the `.env` file. Keep this file secure and never commit it to public repositories.
