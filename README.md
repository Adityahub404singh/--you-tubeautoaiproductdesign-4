# 🚀 Auto AI Video Creator & Publisher

[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://youtubeauto-ai.onrender.com)
[![Docker Support](https://img.shields.io/badge/Docker-Supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-docker--containerization)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live Production App:** [https://youtubeauto-ai.onrender.com](https://youtubeauto-ai.onrender.com)

An advanced, fully-automated AI-powered SaaS application designed to generate video content and seamlessly publish it across social media platforms like **YouTube** and **Instagram**.

---

## 📑 Table of Contents

1. [Project Overview & Architecture](#-project-overview--architecture)
2. [Core Features](#-core-features)
3. [Technology Stack](#-technology-stack)
4. [System Requirements](#-system-requirements)
5. [Environment Configuration](#-environment-configuration)
6. [Local Development Setup](#-local-development-setup)
7. [Docker & Containerization](#-docker--containerization)
8. [Render.com Deployment](#-rendercom-deployment)
9. [Detailed Project Structure](#-detailed-project-structure)
10. [API Reference & Endpoints](#-api-reference--endpoints)
11. [Troubleshooting & FAQ](#-troubleshooting--faq)
12. [Contributing Guidelines](#-contributing-guidelines)
13. [License](#-license)

---

## 🏗️ Project Overview & Architecture

Generating videos programmatically requires heavy media processing tools like **FFmpeg** and a reliable, persistent file system. Serverless platforms (like Vercel or AWS Lambda) strictly limit binary execution, RAM, and execution time.

To overcome this, this project is fully **Dockerized** and deployed as a Web Service on **Render**. This ensures:

* Smooth, uninterrupted video generation.
* A robust containerized environment with persistent media directories.
* Native execution of FFmpeg binaries without memory timeouts.
* Secure handling of long-polling OAuth 2.0 requests for YouTube and Facebook Graph APIs.

---

## ✨ Core Features

### 1. 🤖 AI Video Generation Engine

* **Text-to-Speech (TTS):** Generates high-quality voiceovers from AI-generated scripts.
* **Media Assembly:** Uses FFmpeg to stitch together background videos, audio tracks, and voiceovers.
* **Dynamic Subtitles:** Auto-generates and hardcodes captions onto the video track.
* **Asset Management:** Automatically clears temporary processing files post-generation to save disk space.

### 2. 📱 Instagram Auto-Publishing

* **Graph API Integration:** Securely connects your Instagram Business account via Facebook Graph API.
* **Direct Publishing:** Pushes rendered MP4 files directly to Instagram Reels or Feed.
* **State Management:** Validates OAuth state to prevent CSRF attacks during the connection phase.

### 3. 📺 YouTube Integration

* **OAuth 2.0 Flow:** Complete Google OAuth integration for secure, automated channel access.
* **Video Uploads:** Uses the YouTube Data API v3 to upload videos, set titles, descriptions, and tags automatically.
* **Token Refreshing:** Automatically handles access token expiration using refresh tokens.

### 4. 🔄 Dynamic OAuth Routing

* Smart redirect URIs that automatically read request headers (`x-forwarded-host`, `host`) to adapt seamlessly.
* Works flawlessly whether testing on `localhost:3000` or running live on Render without changing `.env` variables manually.

---

## 🛠️ Technology Stack

### Frontend & UI

* **Next.js 15:** React framework for production (App Router).
* **React 19:** Component-based UI rendering.
* **Tailwind CSS 4:** Utility-first CSS framework for rapid styling.
* **Radix UI:** Unstyled, accessible UI primitives.
* **Framer Motion:** Declarative animations.

### Backend & Core Logic

* **Node.js 20:** JavaScript runtime environment.
* **NextAuth.js (Auth.js):** Secure authentication and session management.
* **Prisma ORM:** Next-generation Node.js and TypeScript ORM.
* **LibSQL / Turso:** Edge-ready SQLite database.
* **FFmpeg & FFprobe:** Core multimedia processing binaries.

### Infrastructure & Deployment

* **Docker:** Containerization for consistent environments.
* **Render.com:** Cloud application hosting (Web Service).
* **pnpm:** Fast, disk space efficient package manager.

---

## ⚙️ System Requirements

To run this project locally, ensure your environment meets the following specifications:

* **OS:** Windows 10/11, macOS, or Linux (Ubuntu/Debian preferred).
* **Node.js:** `v20.x.x` or higher.
* **Package Manager:** `pnpm` (Install via `npm install -g pnpm`).
* **Media Binaries:** FFmpeg and FFprobe **MUST** be installed and added to your system PATH.
  * *Windows*: `winget install gyan.ffmpeg`
  * *macOS*: `brew install ffmpeg`
  * *Linux*: `sudo apt update && sudo apt install ffmpeg`

---

## 🔐 Environment Configuration

Create a `.env.local` file in the root of your project. Below is the comprehensive list of required environment variables and their purposes:

```env
# -----------------------------------------------------------------------------
# CORE NEXT.JS & AUTH SETUP
# -----------------------------------------------------------------------------
# The base URL of your application. Use http://localhost:3000 for local dev.
NEXTAUTH_URL="http://localhost:3000"

# A random 32-character string used to encrypt session tokens.
# Generate one using: `openssl rand -base64 32`
NEXTAUTH_SECRET="your_secure_nextauth_secret_phrase"

# -----------------------------------------------------------------------------
# DATABASE CONNECTION
# -----------------------------------------------------------------------------
# The connection URL for your LibSQL / Turso database.
DATABASE_URL="libsql://your-database-stream-url.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"

# -----------------------------------------------------------------------------
# INSTAGRAM / FACEBOOK GRAPH API
# -----------------------------------------------------------------------------
# Found in your Meta Developer Dashboard under App Settings > Basic.
INSTAGRAM_APP_ID="your_instagram_app_id"
INSTAGRAM_APP_SECRET="your_instagram_app_secret"

# The fallback redirect URI for local development.
INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/auth/instagram/callback"
INSTAGRAM_USER_ID="your_instagram_user_id"

# -----------------------------------------------------------------------------
# YOUTUBE DATA API V3
# -----------------------------------------------------------------------------
# Found in your Google Cloud Console > APIs & Services > Credentials.
YOUTUBE_CLIENT_ID="your_youtube_client_id.apps.googleusercontent.com"
YOUTUBE_CLIENT_SECRET="your_youtube_client_secret"
```

---

## 💻 Local Development Setup

Follow these steps to set up the project on your local machine:

**1. Clone the repository**

```bash
git clone https://github.com/Adityahub404singh/--you-tubeautoaiproductdesign-4.git
cd --you-tubeautoaiproductdesign-4
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Generate Prisma Client**

```bash
pnpm dlx prisma generate
```

**4. Push Database Schema (Optional, if DB is empty)**

```bash
pnpm dlx prisma db push
```

**5. Start the Development Server**

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application should now be running locally.

---

## 🐳 Docker & Containerization

Because this application relies on system-level binaries (FFmpeg) and requires persistent local storage for video rendering, Docker is the recommended way to run this in production.

### Understanding the Dockerfile

The provided `Dockerfile` executes the following build stages:

1. **Base Image:** Uses `node:20-slim` for a lightweight Linux footprint.
2. **System Dependencies:** Runs `apt-get install -y ffmpeg fontconfig` to install required media libraries.
3. **Storage Setup:** Automatically creates necessary directories (`storage/videos`, `storage/audio`, etc.) inside the container to prevent directory-not-found errors during rendering.
4. **App Build:** Copies source files, installs dependencies using pnpm, and runs `pnpm build`.
5. **Expose & Run:** Exposes port 3000 and starts the Next.js production server.

### Local Container Testing

To verify the Docker build locally before pushing to production:

```bash
# Build the image
docker build -t youtubeauto-ai .

# Run the container (mapping port 3000 and injecting env vars)
docker run -p 3000:3000 --env-file .env.local youtubeauto-ai
```

---

## ☁️ Render.com Deployment

Deploying to Render is configured via the included `render.yaml` Blueprint.

1. Connect your GitHub repository to your Render account.
2. Render will automatically detect the `render.yaml` file.
3. It will provision a Docker Web Service.
4. **Important:** You must manually add your `.env` variables in the Render Dashboard under Environment → Environment Variables for the service.
5. Set `NEXTAUTH_URL` in Render to your production URL (e.g., `https://youtubeauto-ai.onrender.com`).

---

## 📂 Detailed Project Structure

```
├── app/                        # Next.js App Router directory
│   ├── api/                    # Backend API Routes
│   │   ├── auth/               # NextAuth and Instagram OAuth handlers
│   │   ├── youtube/            # YouTube OAuth and upload handlers
│   │   └── video/generate/     # Core FFmpeg video generation logic
│   ├── dashboard/              # Protected dashboard UI routes
│   ├── layout.jsx              # Root application layout
│   └── page.jsx                # Landing page
├── components/                 # Reusable React components (Radix/Tailwind)
│   ├── ui/                     # Base UI elements (buttons, inputs, dialogs)
│   ├── YouTubeConnect.jsx      # YouTube OAuth connection component
│   └── InstagramConnect.jsx    # Instagram OAuth connection component
├── prisma/                     # Database schema and migrations
│   └── schema.prisma           # Prisma models definition
├── storage/                    # Local storage for media processing (Ignored in Git)
│   ├── audio/                  # Temporary TTS and music files
│   ├── videos/                 # Final rendered MP4 outputs
│   └── subtitles/              # Generated SRT/VTT subtitle files
├── public/                     # Static assets (images, fonts, favicons)
├── .dockerignore               # Excludes node_modules and storage from Docker context
├── Dockerfile                  # Production container configuration
├── render.yaml                 # Infrastructure as Code for Render.com
├── tailwind.config.js          # Tailwind styling configuration
└── package.json                # Project dependencies and scripts
```

---

## 🔌 API Reference & Endpoints

### `GET /api/youtube/callback`

Handles incoming Google OAuth server verification tokens.

* **Query Params:** `code`, `error`
* **Action:** Exchanges authorization code for access/refresh tokens. Uses dynamic host verification headers to redirect safely to the dashboard.

### `GET /api/auth/instagram`

Manages standard Facebook App OAuth state validation sequences.

* **Query Params:** `action=connect`
* **Action:** Redirects the user to the Meta OAuth dialog with multi-permission scopes (`instagram_content_publish`, `instagram_basic`).

### `POST /api/video/generate`

The core background media assembly module.

* **Payload:** JSON containing video script, desired background style, and TTS voice preference.
* **Action:**
  1. Generates TTS audio.
  2. Downloads background media.
  3. Spawns FFmpeg child processes to splice tracks.
  4. Returns the URL/path of the generated video.

---

## 🛑 Troubleshooting & FAQ

**Q: I am getting `Error: spawn ffmpeg ENOENT` when trying to generate a video locally.**

A: This means Node.js cannot find FFmpeg on your system. Ensure FFmpeg is installed and added to your system's PATH environment variable. On Windows, verify by opening a new terminal and typing `ffmpeg -version`.

**Q: YouTube OAuth redirects me to localhost:3000 even in production.**

A: Ensure that your Google Cloud Console Credentials page has the production URI (`https://youtubeauto-ai.onrender.com/api/youtube/callback`) added to the Authorized redirect URIs list.

**Q: Docker build fails on the `pnpm install` step.**

A: Ensure your `pnpm-lock.yaml` is up to date and committed to the repository. Run `pnpm install` locally and commit the lockfile before triggering a Docker build.

---

## 🤝 Contributing Guidelines

We welcome contributions to improve the Auto AI Video Creator! To contribute:

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
4. Make your changes and ensure code is properly formatted.
5. Commit your changes with descriptive commit messages (`git commit -m "feat: add new TTS voice options"`).
6. Push to your fork (`git push origin feature/your-feature-name`).
7. Submit a Pull Request against the `main` branch of the original repository.

---

## 📝 License

This project is open-source software licensed under the MIT License.

Copyright (c) 2026 Aditya Singh

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
