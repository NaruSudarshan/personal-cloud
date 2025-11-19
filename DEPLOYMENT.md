# Deployment Guide

This guide outlines the steps to deploy the Personal Cloud application with the frontend on **Vercel** and the backend on **Render**.

## Prerequisites

*   GitHub account
*   Vercel account
*   Render account
*   MongoDB Atlas cluster (or any MongoDB provider)
*   AWS S3 Bucket (for file storage)

## Costs & Free Tier Limits

This guide uses the free tiers of the following services. Please be aware of their limitations:

| Service | Plan | Cost | Key Limits |
| :--- | :--- | :--- | :--- |
| **Vercel** | Hobby | Free | Non-commercial use only. |
| **Render** | Free | Free | Spins down after 15 mins of inactivity (cold start ~30s). 750 hours/month (enough for 1 app 24/7). |
| **MongoDB Atlas** | M0 Sandbox | Free | 512MB storage. Shared RAM. |
| **AWS S3** | Free Tier | **Free for 12 Months** | 5GB storage. **After 12 months, standard rates apply** (approx. $0.023/GB/month). |

> [!NOTE]
> **Render Cold Starts**: On the free tier, your backend will "sleep" if not used for 15 minutes. The first request after sleep will take about 30-60 seconds to respond while the server wakes up.


## 1. Backend Deployment (Render)

We will deploy the backend first to get the API URL.

1.  **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2.  **Create Web Service**:
    *   Log in to Render.
    *   Click "New" -> "Web Service".
    *   Connect your GitHub repository.
3.  **Configure Service**:
    *   **Name**: `personal-cloud-backend` (or similar)
    *   **Region**: Choose a region close to you.
    *   **Branch**: `main` (or your working branch)
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
    *   **Instance Type**: Free
4.  **Environment Variables**:
    Add the following environment variables in the "Environment" tab:
    **Required:**
    *   `MONGODB_URI`: Your MongoDB connection string.
    *   `ACCESS_TOKEN_SECRET`: Strong secret for access tokens (e.g., `openssl rand -base64 32`).
    *   `REFRESH_TOKEN_SECRET`: Strong secret for refresh tokens.
    *   `AWS_ACCESS_KEY_ID`: AWS Access Key ID.
    *   `AWS_SECRET_ACCESS_KEY`: AWS Secret Access Key.
    *   `AWS_REGION`: AWS Region (e.g., `us-east-1`).
    *   `S3_BUCKET`: S3 Bucket name.
    *   `GROQ_API_KEY`: Groq API Key.
    *   `FRONTEND_URL`: URL of your Vercel frontend (use `*` temporarily if unknown).

    **Optional (Defaults available):**
    *   `GROQ_MODEL`: AI model to use (Default: `llama-3.3-70b-versatile`).
    *   `ROOT_STORAGE_LIMIT_BYTES`: Storage limit in bytes (Default: 20GB).
    *   `ACCESS_TOKEN_EXPIRY`: Access token duration (Default: `15m`).
    *   `REFRESH_TOKEN_EXPIRY`: Refresh token duration (Default: `7d`).
    *   `NODE_ENV`: Set to `production` (Render usually does this automatically).
5.  **Deploy**: Click "Create Web Service".
6.  **Copy URL**: Once deployed, copy the backend URL (e.g., `https://personal-cloud-backend.onrender.com`).

## 2. Frontend Deployment (Vercel)

1.  **Import Project**:
    *   Log in to Vercel.
    *   Click "Add New..." -> "Project".
    *   Import the same GitHub repository.
2.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `frontend` (Click "Edit" and select the `frontend` folder).
3.  **Environment Variables**:
    *   Expand "Environment Variables".
    *   Add `VITE_API_URL`: The Render backend URL you copied earlier (e.g., `https://personal-cloud-backend.onrender.com/api`). **Important**: Append `/api` to the URL.
4.  **Deploy**: Click "Deploy".

## 3. Final Configuration

1.  **Update Backend CORS**:
    *   Go back to your Render dashboard.
    *   Update the `FRONTEND_URL` environment variable to your actual Vercel deployment URL (e.g., `https://personal-cloud-frontend.vercel.app`).
    *   Render will automatically redeploy.

## Troubleshooting

*   **CORS Errors**: Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly (no trailing slash usually).
*   **Cold Starts**: Render's free tier spins down after inactivity. The first request might take 30-60 seconds.
*   **AI Processing**: The AI embedding generation might be slow on the free tier.
