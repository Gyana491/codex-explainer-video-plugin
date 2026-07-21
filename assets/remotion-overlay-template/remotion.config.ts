import {existsSync} from "node:fs";
import {Config} from "@remotion/cli/config";

const configuredBrowser = process.env.REMOTION_BROWSER_EXECUTABLE;
const windowsBrowsers = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

if (configuredBrowser) {
  Config.setBrowserExecutable(configuredBrowser);
} else if (process.platform === "win32" && process.arch === "arm64") {
  const installedBrowser = windowsBrowsers.find(existsSync);
  if (installedBrowser) Config.setBrowserExecutable(installedBrowser);
}

Config.setCodec("h264");
Config.setAudioCodec("aac");
Config.setPixelFormat("yuv420p");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setCrf(18);

