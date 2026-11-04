import {
  S3Client,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

try {
  await s3.send(
    new HeadBucketCommand({
      Bucket: process.env.S3_BUCKET,
    })
  );

  console.log("RANGA storage connection successful!");
} catch (error) {
  console.error("Storage connection failed:", error.name);
  console.error(error.message);
  process.exitCode = 1;
}
