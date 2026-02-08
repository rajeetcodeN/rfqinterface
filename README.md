# RFQ Intelligence Platform

A secure, serverless application for analyzing RFQ documents.

## 📁 Structure

- **`/`**: Frontend Application (React, Vite, Tailwind).
- **`/api`**: Serverless Functions (Backend Logic & Mistral AI Proxy).
- **`/services`**: Frontend Services (AI Integration, PII Masking).

## 🚀 How to Develop

### 1. Setup Environment
Create a `.env.local` file in the root:
```
MISTRAL_API_KEY=your_key_here
```
*(Note: Client-side `GEMINI_API_KEY` is not used for the extraction flow).*

### 2. Run Locally
To run both the Frontend and the Serverless API locally, use **Vercel CLI**:
```bash
npm install -g vercel
vercel dev
```
*App runs on http://localhost:3000*

If you only need to work on the UI (mock mode):
```bash
npm run dev
```

## ☁️ Deployment

This project is built for **Vercel**.

1. Push to GitHub.
2. Import project in Vercel.
3. Add `MISTRAL_API_KEY` in Vercel Project Settings > Environment Variables.
4. Deploy!

### Security Features
- **PII Masking**: Sensitive data (emails, phones, names) is masked **in your browser** before it is ever sent to the server.
- **Serverless Proxy**: Your API Key is stored safely on the server (Environment Variable), never exposed to the client.
