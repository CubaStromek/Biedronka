# Railway Deployment Guide

This guide will help you deploy your Polish Price Tracking app to Railway.

## Prerequisites

1. A [Railway](https://railway.app) account (GitHub login works)
2. Your code pushed to a GitHub repository

## Deployment Steps

### 1. Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect it's a Node.js project

### 2. Configure Environment Variables

Railway will auto-detect your Node.js app. The default settings should work, but verify:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Add Persistent Volume for Database (Important!)

1. In your Railway project, go to the **Variables** tab
2. Click **"+ New Variable"**
3. Add: `RAILWAY_VOLUME_MOUNT_PATH=/data`
4. Go to your service settings
5. Click **"Volumes"** tab
6. Click **"Add Volume"**
7. Set mount path to: `/data`
8. This ensures your SQLite database persists across deployments

### 4. Deploy!

Railway will automatically:
- Install dependencies
- Build your app (`npm run build`)
- Start the server (`npm start`)

Your app will be live at: `https://your-project-name.railway.app`

## Post-Deployment

### Initialize Database (First Time)

After first deployment, you may need to initialize the database schema:

1. Go to Railway service logs
2. Find your service
3. Click **"Connect"** or use Railway CLI:
   ```bash
   railway connect
   npm run db:push
   ```

Or you can add this to your build script if needed.

## Troubleshooting

### Database Not Persisting
- Make sure you added the volume mount (Step 3)
- Verify `RAILWAY_VOLUME_MOUNT_PATH` environment variable is set

### Build Fails
- Check Railway logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (Railway uses Node 20 LTS by default)

### App Not Starting
- Check that PORT environment variable is being read correctly
- Verify `npm start` command works locally
- Check Railway service logs for startup errors

## Environment Variables

You can add these in Railway's Variables tab:

- `NODE_ENV=production` (set automatically)
- `PORT` (set automatically by Railway)
- `RAILWAY_VOLUME_MOUNT_PATH=/data` (for persistent database)

## Custom Domain

1. In Railway project settings
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** or **"Custom Domain"**
4. Follow instructions to configure DNS

## Monitoring

- View logs in Railway dashboard
- Set up alerts for deployment failures
- Monitor resource usage in the Metrics tab

## Rollback

If something goes wrong:
1. Go to **"Deployments"** tab
2. Find a previous successful deployment
3. Click **"Redeploy"**

---

That's it! Your app should now be live on Railway! 🚂
