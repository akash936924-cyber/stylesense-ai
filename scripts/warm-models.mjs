// Pre-download the CLIP model into ./.cache so the first inspo request
// doesn't pay (or flake on) the ~90MB fetch. Usage: node scripts/warm-models.mjs
import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/clip-vit-base-patch32";

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`warming ${MODEL} (attempt ${attempt})...`);
    const extract = await pipeline("image-feature-extraction", MODEL, {
      dtype: "q8",
      progress_callback: (p) => {
        if (p.status === "progress" && p.file?.endsWith(".onnx")) {
          process.stdout.write(`\r${p.file}: ${Math.round(p.progress)}%   `);
        }
      },
    });
    console.log("\nfeature extractor ready");
    await pipeline("zero-shot-image-classification", MODEL, { dtype: "q8" });
    console.log("zero-shot classifier ready");
    process.exit(0);
  } catch (err) {
    console.error(`\nattempt ${attempt} failed:`, err.message);
    if (attempt === 3) process.exit(1);
  }
}
