# TaskMaster2 - CI/CD Deployment Guide

## 🚀 Quick Start

### Lokalno testiranje z Docker Compose
```bash
docker-compose up --build
```
- Frontend: http://localhost
- Backend: http://localhost:8001

### Lokalni development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (v drugem terminalu)
cd frontend
npm install
npm start
```

## 📦 GitHub Actions CI/CD Pipeline

Pipeline vključuje:
1. **Test faza** - Unit testi za backend in frontend
2. **Build faza** - Gradnja aplikacij z cachingom node_modules
3. **Docker faza** - Gradnja in push Docker slik na Docker Hub
4. **Deploy faza** - Namestitev na Render (samo na main branch)

## ⚙️ Nastavitev za Deployment

### 1. Docker Hub Setup
1. Ustvari račun na https://hub.docker.com
2. Ustvari **Access Token**: Account Settings → Security → New Access Token
3. Kopiraj token (ne geslo!)

### 2. Render Setup

#### Backend Service
1. Pojdi na https://render.com → New → Web Service
2. Poveži GitHub repo **TaskMaster2**
3. Nastavitve:
   - **Name**: `taskmaster-backend`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Instance Type**: Free
4. Environment Variables:
   ```
   PORT=8001
   JWT_SECRET=<strong-random-secret>
   NODE_ENV=production
   ```
5. Kopiraj Service ID iz URL-ja: `srv-xxxxxxxxxxxxx`

#### Frontend Service
1. New → Web Service
2. Poveži isti repo
3. Nastavitve:
   - **Name**: `taskmaster-frontend`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: Docker
   - **Instance Type**: Free
4. Environment Variables:
   ```
   REACT_APP_API_URL=https://taskmaster-backend.onrender.com/api
   ```
   (zamenjaj z URL tvojega backend servisa)
5. Kopiraj Service ID: `srv-yyyyyyyyyyyyy`

#### Render API Key
1. Account Settings → API Keys
2. Create API Key
3. Kopiraj ključ

### 3. GitHub Secrets Setup
Pojdi na GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Dodaj te secrets:
```
DOCKER_USERNAME = <tvoj-dockerhub-username>
DOCKER_PASSWORD = <dockerhub-access-token>
RENDER_API_KEY = <render-api-key>
RENDER_BACKEND_SERVICE_ID = srv-xxxxx
RENDER_FRONTEND_SERVICE_ID = srv-yyyyy
```

## 🧪 Testiranje Pipeline-a

### Push na feature branch
```bash
git add .
git commit -m "Test CI pipeline"
git push origin feature/comments
```
Rezultat: **Samo testi in build** (brez deploya)

### Merge v main
```bash
git checkout main
git merge feature/comments
git push origin main
```
Rezultat: **Testi + Build + Docker push + Deploy na Render**

## 📊 Monitoring

- **GitHub Actions**: github.com/VerhovnikTeodor/TaskMaster2/actions
- **Docker Hub**: hub.docker.com/u/<username>
- **Render Dashboard**: dashboard.render.com

## 🔧 Lokalno testiranje Docker slik

```bash
# Backend
cd backend
docker build -t taskmaster-backend .
docker run -p 8001:8001 -e JWT_SECRET=test taskmaster-backend

# Frontend
cd frontend
docker build -t taskmaster-frontend .
docker run -p 80:80 taskmaster-frontend
```

## 📝 Pomembne datoteke

- `.github/workflows/ci-test.yml` - CI/CD pipeline
- `backend/Dockerfile` - Backend Docker slika
- `frontend/Dockerfile` - Frontend Docker slika (multi-stage z Nginx)
- `docker-compose.yml` - Lokalno testiranje
