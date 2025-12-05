# Push to GitHub - Step by Step Guide

## Option 1: Create a New GitHub Repository

### Step 1: Create Repository on GitHub
1. Go to [github.com](https://github.com) and log in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `polska-cena` (or any name you like)
   - **Description**: "Polish Price Tracking App"
   - **Visibility**: Choose Public or Private
   - **DO NOT** check "Initialize with README" (we already have code)
4. Click **"Create repository"**

### Step 2: Push Your Code

Open PowerShell/Terminal in your project folder and run these commands:

```bash
# Navigate to your project
cd "c:\Users\jakub\OneDrive\AI\Apps\polska_cena-main"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit - Polish Price Tracking App ready for Railway deployment"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/polska-cena.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: When you push, GitHub will ask for your username and password. 
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create one here: https://github.com/settings/tokens
  - Click "Generate new token" → "Generate new token (classic)"
  - Give it a name like "Railway Deploy"
  - Check `repo` scope
  - Click "Generate token"
  - Copy the token and use it as your password

---

## Option 2: If You Already Have a GitHub Account Set Up

If you've used GitHub before with Git credentials:

```bash
cd "c:\Users\jakub\OneDrive\AI\Apps\polska_cena-main"
git init
git add .
git commit -m "Initial commit - Polish Price Tracking App"
git remote add origin https://github.com/YOUR_USERNAME/polska-cena.git
git branch -M main
git push -u origin main
```

---

## Troubleshooting

### "Repository already exists" error
If the remote already exists, use:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/polska-cena.git
git push -u origin main
```

### "Authentication failed"
- Make sure you're using a Personal Access Token, not your password
- Or set up SSH keys for easier authentication

### "Nothing to commit"
This means all files are already committed. Just push:
```bash
git push -u origin main
```

---

## After Pushing

Once your code is on GitHub:
1. Go to your repository on GitHub
2. Verify all files are there
3. Then follow `RAILWAY_QUICKSTART.md` to deploy to Railway!
