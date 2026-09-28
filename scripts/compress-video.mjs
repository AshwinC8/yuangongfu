#!/usr/bin/env node
// Compresses a raw video for use as a muted, looping background clip
// (the pattern every video in this site follows — see LoopDelayVideo /
// CrossfadeVideo / Hero, which all render `muted`).
//
// Usage:
//   node scripts/compress-video.mjs <input> <output.mp4> [--max-width=1280]
//
// Example:
//   node scripts/compress-video.mjs raw-videos/Corporate.MOV public/videos/corporate.mp4

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const [, , input, output, ...rest] = process.argv;

if (!input || !output) {
  console.error("Usage: node scripts/compress-video.mjs <input> <output.mp4> [--max-width=1280]");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

const maxWidthArg = rest.find((a) => a.startsWith("--max-width="));
const maxWidth = maxWidthArg ? Number(maxWidthArg.split("=")[1]) : 1280;

// Only downscale, never upscale; keep even dimensions (required by yuv420p).
const scaleFilter = `scale='min(${maxWidth},iw)':-2`;

const args = [
  "-y",
  "-i", input,
  "-vf", scaleFilter,
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "26",
  // Cap peak bitrate — these are small, muted, non-focal background loops,
  // so busy/high-motion footage doesn't need CRF's uncapped bitrate spikes.
  "-maxrate", "2000k",
  "-bufsize", "4000k",
  "-pix_fmt", "yuv420p",
  "-an", // strip audio — every player using these clips renders `muted`
  "-movflags", "+faststart",
  output,
];

console.log(`Compressing ${input} -> ${output} (max width ${maxWidth}px)`);
execFileSync("ffmpeg", args, { stdio: "inherit" });
