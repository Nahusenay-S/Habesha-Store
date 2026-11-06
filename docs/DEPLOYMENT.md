# Habesha Store - Production Deployment Guide 🚀

This guide explains how to deploy the **Habesha Store** platform to production across **Vercel** (Frontend) and **Railway / Render / Render.com** (Backend + Neon PostgreSQL).

---

## 1. Architecture Overview

- **Database**: Neon Serverless PostgreSQL (`schema.sql` automatically runs on connection).
- **Backend**: Node.js + Express (`http://localhost:5000` / `https://api.yourdomain.com`).
- **Frontend**: Next.js 14+ (`http://localhost:3000` / `https://yourdomain.com`).

---

## 2. Option A: Vercel (Frontend) + Render / Railway (Backend) — *Recommended*

### Step 1: Deploy Backend to Railway or Render

1. Connect your GitHub repository (`https://github.com/Nahusenay-S/Habesha-Store.git`).
2. Set the **Root Directory** to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm run start`
5. Configure Environment Variables:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<neon-host>/<dbname>?sslmode=require`
   - `JWT_SECRET`: A secure 32+ character random secret string.
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `STRIPE_SECRET_KEY`: (Optional) Your Stripe Secret Key `sk_live_...` or test key.
6. Click **Deploy**. Note your live backend URL (e.g. `https://habesha-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel

1. In [Vercel](https://vercel.com), click **Add New Project** and import the GitHub repository.
2. Under **Project Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://habesha-backend.onrender.com/api` (URL of backend created in Step 1)
4. Click **Deploy**. Vercel will build and deploy all 23 static pages with global CDN caching.

---

## 3. Option B: Render Blueprint (`render.yaml`)

We have included `render.yaml` in the repository root.
1. Log in to [Render](https://render.com).
2. Go to **Blueprints** → **New Blueprint Instance**.
3. Select this repository.
4. Render will automatically detect both the backend and frontend services, wire up internal networking, and prompt for your Neon `DATABASE_URL`.

---

## 4. Post-Deployment Verification Checklist

1. [ ] Access storefront homepage at your live domain.
2. [ ] Test language toggle (`🇬🇧 EN` ↔ `🇪🇹 አማርኛ`) in header.
3. [ ] Test buyer registration or login.
4. [ ] Test artisan product photo upload from device.
5. [ ] Verify payment and order tracking milestones.
