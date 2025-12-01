# OneVault

A modern, self-hosted file storage and search app with AI-powered document search and versioning.
📌 **Live Demo:** https://onevault.narusudarshan.com

This repository contains a React + Vite frontend and an Express + MongoDB backend. The app supports role-based users (root/admin and regular temporary users), file uploads with versioning, AI processing for PDFs (embeddings & search), and S3-compatible storage for file objects.

---

## Quick overview

- Frontend: `frontend/` (React, Vite, TailwindCSS)
- Backend: `backend/` (Node.js, Express, Mongoose)
- Database: MongoDB (Atlas or self-hosted)
- Storage: AWS S3 (or compatible S3 endpoint)
- AI: Groq / configured model for embeddings and LLM inference

---

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB Atlas account or local MongoDB
- AWS account and S3 bucket (or any S3-compatible storage)
- Groq API key (for LLM inference) — optional but required for AI features

---

## Setup (development)

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/NaruSudarshan/OneVault.git
cd personal-cloud

# backend
cd backend
npm install

# frontend (open a second terminal)
cd ../frontend
npm install
```

2. Create a `.env` file for the backend from the example and fill values:

```bash
cp backend/.env.example backend/.env
# edit backend/.env and fill the required values (MONGODB_URI, S3, AWS keys, tokens...)
```

Important: Do NOT commit real secrets. Keep `.env` out of source control.

## Environment variables

See `backend/.env.example` for the full list. Key variables include:

- `MONGODB_URI`, `DB_NAME` — MongoDB connection
- `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — S3 storage
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `JWT_SECRET` — JWT secrets
- `FRONTEND_URL` — used for CORS/cookie config in development

If you add or change environment keys, document them in `backend/.env.example`.

---

## Run locally

Start the backend (development):

```bash
cd backend
npm run dev   # or: node index.js
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open the app in your browser at `http://localhost:5173`.

---

## Features

- Role-based user management (root/admin and temporary users)
- File upload with versioning (uploads with same original filename under the same `rootOwner` are added as new versions)
- AI-powered PDF processing (embeddings and semantic search)
- S3-compatible storage for file objects
- Dashboard with statistics (files, storage usage, AI processing state)

---

## Project Structure

```
personal-cloud/
├── backend/                 # Node.js + Express Backend
│   ├── middleware/          # Auth and other middleware
│   ├── models/              # Mongoose models (User, File, Embedding)
│   ├── routes/              # API routes
│   ├── services/            # Business logic (AI processing, S3)
│   └── index.js             # Entry point
├── frontend/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Auth)
│   │   ├── pages/           # Page components
│   │   └── main.jsx         # Entry point
└── README.md
```

---

## Troubleshooting

### Common Issues

1.  **MongoDB Connection Error**:
    *   Ensure `MONGODB_URI` in `backend/.env` is correct.
    *   Check if your IP is whitelisted in MongoDB Atlas.

2.  **S3 Upload Failed**:
    *   Verify `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `S3_BUCKET`.
    *   Ensure the bucket exists and the user has `PutObject` permissions.

3.  **AI Processing Stuck**:
    *   Check backend logs for errors in `embeddingProcessor.js`.
    *   Ensure you have a stable internet connection for downloading models (first run).

---

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.

---

## Notes & Operational Guidance

- The backend returns generated temporary user passwords only once at creation. Keep a copy immediately — the password is not stored in plaintext and will not be returned again.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

