FROM node:20-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg fontconfig && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy all files
COPY . .

# Build
RUN pnpm run build

# Create storage directories
RUN mkdir -p storage/videos storage/audio storage/thumbnails storage/music storage/temp storage/subtitles

EXPOSE 3000

CMD ["pnpm", "start"]
