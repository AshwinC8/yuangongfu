#!/usr/bin/env node
// Compresses a raw video for use as a muted, looping background clip
// (the pattern every video in this site follows — see LoopDelayVideo /
// CrossfadeVideo / Hero, which all render `muted`).
//
// Usage:
//   node scripts/compress-video.mjs <input> <output.mp4> [--max-width=1280] [--crf=26] [--preset=medium] [--maxrate=2000]
//
// Example:
//   node scripts/compress-video.mjs raw-videos/Corporate.MOV public/videos/corporate.mp4

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const [, , input, output, ...rest] = process.argv;

if (!input || !output) {
  console.error("Usage: node scripts/compress-video.mjs <input> <output.mp4> [--max-width=1280] [--crf=26] [--preset=medium] [--maxrate=2000]");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

const maxWidthArg = rest.find((a) => a.startsWith("--max-width="));
const maxWidth = maxWidthArg ? Number(maxWidthArg.split("=")[1]) : 1280;

// Quality knobs. Defaults are what every shipped clip used up to now; raise --crf
// (or lower --maxrate, in kbit/s) to trade a little sharpness for smaller files.
const opt = (name, fallback) => rest.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const crf = opt("crf", "26");
const preset = opt("preset", "medium");
const maxrate = Number(opt("maxrate", "2000"));

// Only downscale, never upscale; keep even dimensions (required by yuv420p).
const scaleFilter = `scale='min(${maxWidth},iw)':-2`;

// Everything shipped must be plain SDR BT.709. iPhone footage is often HLG HDR,
// and browsers disagree on it: Safari plays HLG/PQ as real HDR on HDR-capable
// screens (white walls blow out, subjects turn into silhouettes) while Chrome
// flattens it. So HDR sources are tone-mapped to SDR here, and every output is
// explicitly tagged BT.709 (untagged files leave each browser to guess).
const transfer = execFileSync(
  "ffprobe",
  ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "default=nw=1:nk=1", input],
  { encoding: "utf8" },
).trim();

// HLG: clip + npl=450 was tuned to match how Chrome renders these clips.
// PQ: standard hable tone-map.
const hdrToSdr = {
  "arib-std-b67":
    "zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=450,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=clip:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p",
  smpte2084:
    "zscale=tin=smpte2084:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p",
}[transfer];
if (hdrToSdr) console.log(`HDR source (${transfer}) detected: tone-mapping to SDR BT.709`);

const videoFilter = [scaleFilter, hdrToSdr].filter(Boolean).join(",");

const args = [
  "-y",
  "-i", input,
  "-vf", videoFilter,
  "-c:v", "libx264",
  "-preset", preset,
  "-crf", crf,
  // Cap peak bitrate — these are small, muted, non-focal background loops,
  // so busy/high-motion footage doesn't need CRF's uncapped bitrate spikes.
  "-maxrate", `${maxrate}k`,
  "-bufsize", `${maxrate * 2}k`,
  "-pix_fmt", "yuv420p",
  "-colorspace", "bt709",
  "-color_primaries", "bt709",
  "-color_trc", "bt709",
  "-color_range", "tv",
  // Also write the tags into the H.264 stream itself: the flags above don't
  // always stick when the source is untagged, and an untagged file is exactly
  // what leaves browsers guessing.
  "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0",
  "-an", // strip audio — every player using these clips renders `muted`
  "-movflags", "+faststart",
  output,
];

console.log(`Compressing ${input} -> ${output} (max width ${maxWidth}px, crf ${crf}, preset ${preset}, maxrate ${maxrate}k)`);
execFileSync("ffmpeg", args, { stdio: "inherit" });
