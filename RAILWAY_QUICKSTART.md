# Railway Quick Start

## 🚀 One-Click Deploy

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repo
5. Add a **Volume** (mount path: `/data`)
6. Add environment variable: `RAILWAY_VOLUME_MOUNT_PATH=/data`
7. Deploy! ✨

Your app will be live in ~2 minutes!

## 📝 What Was Changed

- ✅ Server now listens on `0.0.0.0` (for Railway networking)
- ✅ Database uses persistent volume path
- ✅ Build process optimized for production
- ✅ All configuration files added

## 🔧 First-Time Setup

After first deploy, if database schema needs initialization:
- Check logs in Railway dashboard
- Database will auto-create on first use, but schema may need pushing

## 🌐 Your App URL

Railway will give you a URL like: `https://your-app.railway.app`

You can also add a custom domain in Railway settings!

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions.
