# Deploying Student Management Hub to Render

This guide walks you through deploying the **frontend first**, then the **backend**, then wiring them together so everything works end-to-end. Two tiny code prep changes have already been made for you (port + Mongo URI are now env-driven, and a SPA rewrite file was added).

> **Heads-up on order:** A static frontend can be *deployed* before the backend, but it can only *function* once it knows the backend URL. So you'll deploy the frontend, then deploy the backend, then come back to the frontend to set the `VITE_API_ROOT` environment variable and trigger a redeploy. The very last step is the one that makes both halves talk to each other.

---

## Part 0 — One-time prerequisites

1. Push the whole project to a GitHub repo (Render deploys from GitHub/GitLab).
   ```bash
   cd StudentManagementSystem
   git add .
   git commit -m "Prep for Render deployment"
   git push origin main
   ```
2. Create a free Render account at https://render.com and connect it to your GitHub account.
3. Create a free MongoDB Atlas cluster (used in Part 3):
   - Go to https://www.mongodb.com/cloud/atlas → sign in → **Build a Database** → **M0 Free**.
   - Pick a region close to your Render region (e.g., AWS / Oregon if your Render is US-West).
   - **Database Access** → add a user with username + password. Save these.
   - **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Render's outbound IPs aren't fixed on the free plan.
   - **Database** → **Connect** → **Drivers** → copy the SRV connection string. It looks like:
     ```
     mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<user>` and `<password>` with the credentials you set, and append the database name before the `?`:
     ```
     mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/student_db?retryWrites=true&w=majority
     ```
   - Keep this string handy — it's `MONGODB_URI` in Part 3.

---

## Part 1 — Deploy the frontend (React + Vite) as a Static Site

1. In the Render dashboard, click **New +** → **Static Site**.
2. Connect the GitHub repo containing this project.
3. Fill in the form:
   - **Name:** `student-management-frontend` (or anything you like — it becomes the subdomain).
   - **Branch:** `main` (or whichever branch you push to).
   - **Root Directory:** `StudentManagementSystem/frontend`
     (If your repo's root *is* `StudentManagementSystem/`, just use `frontend`.)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Leave **Auto-Deploy** on.
5. Click **Create Static Site**. The first build will take 2–4 minutes.
6. When the build finishes, Render gives you a URL like
   `https://student-management-frontend.onrender.com`.
   Open it. The UI will load but every API call will fail — that's expected; we haven't built the backend yet.

> ℹ️ The `frontend/public/_redirects` file (added during prep) makes all routes resolve to `index.html` so React Router and hard refreshes keep working.

---

## Part 2 — Deploy the backend (Spring Boot) as a Web Service

The backend uses the `Dockerfile` already in `backend/`.

1. In the Render dashboard, click **New +** → **Web Service**.
2. Connect the same GitHub repo.
3. Fill in the form:
   - **Name:** `student-management-backend`
   - **Region:** Same region as your Atlas cluster.
   - **Branch:** `main`
   - **Root Directory:** `StudentManagementSystem/backend`
   - **Runtime / Environment:** **Docker** (Render should auto-detect this from the Dockerfile).
   - **Instance Type:** **Free**.
4. Scroll to **Environment Variables** and add:

   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | Paste the Atlas SRV string from Part 0 (with username, password, and `/student_db` in it). |
   | `JAVA_TOOL_OPTIONS` | `-Xmx450m` *(optional but recommended — keeps the JVM inside the free tier's 512 MB limit)* |

   > Don't set `PORT` yourself — Render injects it automatically and the app already reads `${PORT}` thanks to the prep change.

5. Click **Create Web Service**. The first Docker build takes 5–8 minutes (Maven downloads dependencies).
6. When deploy completes, Render gives you a backend URL like
   `https://student-management-backend.onrender.com`.
7. Verify it's alive by visiting:
   `https://student-management-backend.onrender.com/api/students/health`
   You should see a small JSON health response. Also check the **Logs** tab — you should see Spring Boot finish startup and either "Connected to MongoDB" or the in-memory fallback message.

> 💤 **Free-tier cold starts:** Render's free Web Services sleep after ~15 min of inactivity. The first request after a sleep takes 30–60 seconds while it spins back up. This is normal.

---

## Part 3 — Wire the frontend to the backend

Now that the backend has a public URL, point the frontend at it.

1. In Render, open your **frontend static site** → **Environment** tab.
2. **Add Environment Variable**:
   - **Key:** `VITE_API_ROOT`
   - **Value:** `https://student-management-backend.onrender.com/api`
     *(no trailing slash — use the exact URL Render gave you in Part 2 with `/api` appended)*
3. Save changes. Render will automatically trigger a fresh build.
4. While that builds, also fix CORS on the backend so the browser is allowed to call it from your frontend domain:
   - Open your **backend web service** → **Environment** tab.
   - Add an env var:
     - **Key:** `SPRING_MVC_CORS_ALLOWED_ORIGINS`
     - **Value:** `https://student-management-frontend.onrender.com`
       *(use your actual frontend URL — no trailing slash)*
   - Save. Render redeploys the backend automatically.

> Why this works: `import.meta.env.VITE_API_ROOT` is baked into the static bundle at build time (`frontend/src/lib/api.js` already reads it), so a redeploy is required whenever you change it.

---

## Part 4 — Verify the deployment

1. Open the frontend URL: `https://student-management-frontend.onrender.com`.
2. Log in with the demo admin account:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Open the browser DevTools → **Network** tab → confirm requests go to your `…-backend.onrender.com/api/…` URL and return `200 OK`.
4. Try a quick smoke test:
   - Create a student.
   - Refresh the page — the student should persist (because Mongo Atlas is connected).
   - Open the app in a second browser window and log in as `demo` / `demo123`. Update something in the admin window — the change should appear live in the other window (Server-Sent Events working).

If steps 1–4 all pass, you're done. Both halves are live.

---

## Common issues & fixes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Frontend loads but every API call fails with `Failed to fetch` or CORS error | `VITE_API_ROOT` not set, or CORS not allowing your frontend origin | Re-check Part 3 — both env vars must be set, and both services redeployed afterwards. |
| Backend logs show "MongoSocketOpenException" | Atlas Network Access doesn't allow Render | Atlas → Network Access → confirm `0.0.0.0/0` is in the allowlist. |
| Backend keeps restarting / OOM in logs | JVM exceeding free-tier 512 MB | Set `JAVA_TOOL_OPTIONS=-Xmx450m` env var on the backend. |
| Hard-refreshing a route like `/students/123` shows 404 on the static site | SPA rewrite missing | Confirm `frontend/public/_redirects` exists with `/*  /index.html  200`. |
| Backend deploy fails with "port already in use" or "no open ports detected" | `server.port` not honoring `$PORT` | Confirm `application.properties` has `server.port=${PORT:8080}` (the prep step set this). |
| First request after idle takes ~45 seconds | Free-tier cold start | Expected. Upgrade to a paid Web Service to eliminate, or hit `/api/students/health` on a schedule to keep it warm. |

---

## Quick reference — what each side needs

**Frontend (Static Site)**
- Root Directory: `StudentManagementSystem/frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Env: `VITE_API_ROOT = https://<backend>.onrender.com/api`

**Backend (Web Service, Docker)**
- Root Directory: `StudentManagementSystem/backend`
- Runtime: Docker (uses the existing `Dockerfile`)
- Env: `MONGODB_URI = <Atlas SRV string with /student_db>`
- Env: `SPRING_MVC_CORS_ALLOWED_ORIGINS = https://<frontend>.onrender.com`
- Env (optional): `JAVA_TOOL_OPTIONS = -Xmx450m`
