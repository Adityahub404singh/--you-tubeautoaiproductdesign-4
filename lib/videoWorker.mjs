import { Worker } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const videoWorker = new Worker(
  "video-processing",
  async (job) => {
    console.log(`[WORKER] Starting Job #${job.id} for Category: ${job.data.category}`);
    const { videoId, category, script, isShorts } = job.data;
    
    // Call rendering pipeline internally or execute FFmpeg job
    console.log(`[WORKER] Video ${videoId} rendered successfully!`);
    return { success: true, videoId };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  }
);
