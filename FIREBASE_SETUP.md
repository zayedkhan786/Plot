# 🏡 Shree Dungar Residency — Firebase Setup Guide

## Step 1: Create Firebase Project (5 min)

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name: `shree-dungar-residency`
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

> ✅ **Free plan is enough** — 50k reads/day, 20k writes/day, 1GB storage, up to 5 users simultaneously. No credit card.

---

## Step 2: Enable Authentication — Email/Password

1. Left sidebar → **Authentication** → **Get started**
2. Click **Email/Password** → Toggle **Enable** → **Save**
3. Go to **Users** tab → **Add user** for each team member:

```
Email: admin@yourcompany.com    Password: StrongPass123!
Email: sales@yourcompany.com    Password: StrongPass456!
Email: office@yourcompany.com   Password: StrongPass789!
```

> 🔒 **No public signup** — only users you add here can log in. There is NO registration page.

---

## Step 3: Enable Firestore Database

1. Left sidebar → **Firestore Database** → **Create database**
2. Select **Production mode**
3. Choose region: **asia-south1 (Mumbai)** for best speed in India
4. Click **Done**
5. Go to the **Rules** tab → Replace existing rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

---

## Step 4: Get Config Keys → Fill .env

1. Firebase Console → **Project Settings** (⚙️ gear icon, top left)
2. Scroll down to **Your apps** → click the **</>** (Web) icon
3. Register app → name it `shree-dungar-web` → click **Register app**
4. Copy the `firebaseConfig` object values

5. Open `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=AIzaSy_YOUR_ACTUAL_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

6. **Restart the dev server**: `npm run dev`

---

## Step 5: Seed the Database (Once)

1. Log in to the app with your admin email
2. Go to **⚙️ Setup / Seed** in the sidebar
3. Expand Step 5 → click **"Initialize 166 Plots"**
4. Wait 10–15 seconds → ✅ Done!

---

## Step 6: Start Using

1. **Plot Map** → Click any plot → Edit buyer info, price, payment → Save
2. **Finance** → See all revenue and pending amounts
3. **Receipts** → Select plot → Download receipt as PNG
4. **Enquiries** → Log visitor leads and follow-ups

---

## Deploying Online (Optional — for team access anywhere)

If you want the app accessible from any device (office, home, phone):

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting
# → Select your project
# → Build directory: dist
# → Single page app: Yes

# Build + Deploy
npm run build
firebase deploy
```

Your app will be live at: `https://your-project.web.app`

---

## Summary: Who Can Access What

| What | Who |
|---|---|
| Login | Only users you add in Firebase Console |
| Read/edit plots | Any logged-in user |
| Record payments | Any logged-in user |
| Download receipts | Any logged-in user |
| Add enquiries | Any logged-in user |
| Firestore data | Not accessible to public |
| Cost | Free (Spark plan) |
