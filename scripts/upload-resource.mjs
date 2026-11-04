import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npm run upload -- <path-to-pdf>");
  process.exit(1);
}

const fileName = path.basename(filePath);

if (path.extname(fileName).toLowerCase() !== ".pdf") {
  console.error("Only PDF files are supported.");
  process.exit(1);
}

const file = await readFile(filePath);
const fileInfo = await stat(filePath);

if (file.subarray(0, 5).toString() !== "%PDF-") {
  console.error("The supplied file is not a valid PDF.");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const key = `resources/${Date.now()}-${fileName}`;

try {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: "application/pdf",
      ContentLength: fileInfo.size,
    })
  );

  console.log("\nUpload successful!");
  console.log("Bucket:", process.env.S3_BUCKET);
  console.log("File:", fileName);
  console.log("Storage key:", key);
  console.log("Size:", (fileInfo.size / 1024 / 1024).toFixed(2), "MB");
} catch (error) {
  console.error("Upload failed:", error.name);
  console.error(error.message);
  process.exitCode = 1;
}
