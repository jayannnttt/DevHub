<div align="center">
  <img src="client/public/devhub-lockup-transparent.png" alt="DevHub" width="280" />
  <p><strong>Open-Source Repository Intelligence & Developer Benchmarking Engine</strong></p>
</div>

---

## ⚡ Overview

**DevHub** is an open-source intelligence platform designed for engineers, engineering leads, and technical recruiters to search, inspect, and benchmark GitHub repositories and developer profiles in real time.

Built with a fast, responsive UI and an Express/SQLite backend that interfaces with the GitHub REST API.

---

## ✨ Features

- **🔍 Centered Global Search**: Search across GitHub's global ecosystem for repositories and developer profiles.
- **⚔️ Head-to-Head Repository Comparison**: Compare two GitHub repositories side-by-side on stars, forks, issues, language breakdown, and velocity.
- **👥 Developer Benchmarks**: Compare engineering profiles, top languages, follower counts, and public codebase contributions.
- **📁 Research Workspace (My Workspace)**: Bookmark repositories and developers with personal custom notes and category tags.
- **🔐 Secure Authentication**: Integrated user registration and login powered by JWT and SQLite.
- **⚡ Rate-Limit Awareness**: Real-time GitHub API rate-limit monitor to keep you informed of request quotas.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** with custom dark aesthetic & design tokens
- **Lucide React** icons
- **Axios**

### Backend
- **Node.js** + **Express**
- **SQLite3** (`better-sqlite3` / `sqlite3`)
- **bcryptjs** (password hashing)
- **jsonwebtoken** (JWT session tokens)
- **Axios** (GitHub REST API requests with optional token authorization)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/jayannnttt/DevHub.git
cd DevHub
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
npm start
```
*The server will start on `http://localhost:5000` and automatically initialize the SQLite database.*

> **Tip**: Add a personal GitHub token to `server/.env` under `GITHUB_TOKEN=` to increase your GitHub API rate limit from 60 to 5,000 requests/hour.

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
*The client dev server will launch at `http://localhost:5173`.*

---

## 📜 License

MIT License. Feel free to contribute or adapt for your own open-source tools!
