# Push to GitHub - Authentication Required

The code is committed locally but needs to be authenticated to push to GitHub.

## Method 1: Using Personal Access Token (Recommended)

### Step 1: Create a Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Biedronka Deploy`
4. Set expiration: `90 days` (or No expiration)
5. Check the **`repo`** checkbox (this gives full repository access)
6. Click **"Generate token"** at the bottom
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Push Using Token
Open PowerShell and run:

```powershell
cd "c:\Users\jakub\OneDrive\AI\Apps\polska_cena-main"
git push -u origin main
```

When prompted:
- **Username**: `CubaStromek`
- **Password**: Paste your Personal Access Token (not your GitHub password!)

---

## Method 2: Using GitHub Desktop (Easier for Windows)

1. Download: https://desktop.github.com/
2. Install and sign in with your GitHub account
3. Click **"File"** → **"Add Local Repository"**
4. Browse to: `c:\Users\jakub\OneDrive\AI\Apps\polska_cena-main`
5. Click **"Publish repository"**
6. Done! ✨

---

## Method 3: Using GitHub CLI

If you have GitHub CLI installed:

```powershell
gh auth login
cd "c:\Users\jakub\OneDrive\AI\Apps\polska_cena-main"
git push -u origin main
```

---

## Verify It Worked

After pushing, refresh: https://github.com/CubaStromek/Biedronka

You should see all your code files there!

---

**Need help?** The easiest method is Method 2 (GitHub Desktop) - it handles authentication automatically.
