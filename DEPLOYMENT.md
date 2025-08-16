# 🌐 Cloud Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Deploy Backend to Vercel

```bash
# Login to Vercel
vercel login

# Deploy your backend
vercel --prod
```

### Step 2: Set Environment Variables

After deployment, add these environment variables in Vercel dashboard:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A random secret key for JWT tokens

### Step 3: Update Frontend Configuration

1. Copy your deployed backend URL from Vercel
2. Update `src/config/api.js` with your production URL
3. Deploy frontend to Vercel or Netlify

### Step 4: Test

Your app will now work 24/7 without needing your computer!

## Alternative Options:

### 1. Railway (Free Tier)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 2. Render (Free Tier)

- Push code to GitHub
- Connect GitHub repo to Render
- Automatic deployments

### 3. Heroku (Paid)

```bash
npm install -g heroku
heroku create your-app-name
git push heroku main
```

## Benefits:

✅ 24/7 uptime
✅ No need to keep computer on
✅ Professional hosting
✅ Automatic SSL certificates
✅ Global CDN
✅ Free tier available
