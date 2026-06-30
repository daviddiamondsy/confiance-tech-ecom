/**
 * Download official Apple Store product images and save as catalog PNGs.
 * Sources: store.storeimages.cdn-apple.com (wid=940 matches existing catalog size).
 */
import { execSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public/product-images");

const SOURCES: Array<{ file: string; url: string }> = [
  {
    file: "iphone-15.png",
    url: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink?wid=940",
  },
  {
    file: "iphone-17.png",
    url: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-finish-select-black-202509_GEO_US?wid=940",
  },
  {
    file: "iphone-17-pro.png",
    url: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-finish-select-deepblue-202509?wid=940",
  },
  {
    file: "iphone-17-pro-max.png",
    url: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-17-pro-max-finish-select-deepblue-202509?wid=940",
  },
];

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const tmp = `${dest}.tmp`;
  await import("node:fs/promises").then((fs) => fs.writeFile(tmp, buffer));
  execSync(`sips -s format png "${tmp}" --out "${dest}"`, { stdio: "inherit" });
  execSync(`rm "${tmp}"`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const { file, url } of SOURCES) {
    const dest = path.join(OUT_DIR, file);
    if (existsSync(dest) && process.argv.includes("--skip-existing")) {
      console.log(`SKIP ${file} (exists)`);
      continue;
    }
    console.log(`Downloading ${file}...`);
    await download(url, dest);
    console.log(`Saved ${dest}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
