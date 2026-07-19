# 🚀 Auto AI Video Creator & Publisher

[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://youtubeauto-ai.onrender.com)
[![Docker Support](https://img.shields.io/badge/Docker-Supported-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-docker--production-deployment)
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
*   Smooth, uninterrupted video generation.
*   A robust containerized environment with persistent media directories.
*   Native execution of FFmpeg binaries without memory timeouts.
*   Secure handling of long-polling OAuth 2.0 requests for YouTube and Facebook Graph APIs.

---

## ✨ Core Features

### 1. 🤖 AI Video Generation Engine
*   **Text-to-Speech (TTS):** Generates high-quality voiceovers from AI-generated scripts.
*   **Media Assembly:** Uses FFmpeg to stitch together background videos, audio tracks, and voiceovers.
*   **Dynamic Subtitles:** Auto-generates and hardcodes captions onto the video track.
*   **Asset Management:** Automatically clears temporary processing files post-generation to save disk space.

### 2. 📱 Instagram Auto-Publishing
*   **Graph API Integration:** Securely connects your Instagram Business account via Facebook Graph API.
*   **Direct Publishing:** Pushes rendered MP4 files directly to Instagram Reels or Feed.
*   **State Management:** Validates OAuth state to prevent CSRF attacks during the connection phase.

### 3. 📺 YouTube Integration
*   **OAuth 2.0 Flow:** Complete Google OAuth integration for secure, automated channel access.
*   **Video Uploads:** Uses the YouTube Data API v3 to upload videos, set titles, descriptions, and tags automatically.
*   **Token Refreshing:** Automatically handles access token expiration using refresh tokens.

### 4. 🔄 Dynamic OAuth Routing
*   Smart redirect URIs that automatically read request headers (`x-forwarded-host`, `host`) to adapt seamlessly.
*   Works flawlessly whether testing on `localhost:3000` or running live on Render without changing `.env` variables manually.

---

## 🛠️ Technology Stack

### Frontend & UI
*   **Next.js 15:** React framework for production (App Router).
*   **React 19:** Component-based UI rendering.
*   **Tailwind CSS 4:** Utility-first CSS framework for rapid styling.
*   **Radix UI:** Unstyled, accessible UI primitives.
*   **Framer Motion:** Declarative animations.

### Backend & Core Logic
*   **Node.js 20:** JavaScript runtime environment.
*   **NextAuth.js (Auth.js):** Secure authentication and session management.
*   **Prisma ORM:** Next-generation Node.js and TypeScript ORM.
*   **LibSQL / Turso:** Edge-ready SQLite database.
*   **FFmpeg & FFprobe:** Core multimedia processing binaries.

### Infrastructure & Deployment
*   **Docker:** Containerization for consistent environments.
*   **Render.com:** Cloud application hosting (Web Service).
*   **pnpm:** Fast, disk space efficient package manager.

---

## ⚙️ System Requirements

To run this project locally, ensure your environment meets the following specifications:

*   **OS:** Windows 10/11, macOS, or Linux (Ubuntu/Debian preferred).
*   **Node.js:** `v20.x.x` or higher.
*   **Package Manager:** `pnpm` (Install via `npm install -g pnpm`).
*   **Media Binaries:** FFmpeg and FFprobe **MUST** be installed and added to your system PATH.
    *   *Windows*: `winget install gyan.ffmpeg`
    *   *macOS*: `brew install ffmpeg`
    *   *Linux*: `sudo apt update && sudo apt install ffmpeg`

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
DATABASE_URL="libsql://your-database-stream-url.turso.io?authToken=your_token"

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
