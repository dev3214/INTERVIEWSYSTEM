import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    // Generate a signed URL valid for 5 minutes
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch file", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const candidateId = formData.get("candidateId") as string;

  if (!file || !candidateId) {
    return NextResponse.json({ error: "Missing file or candidateId" }, { status: 400 });
  }

  // Enforce 10MB file size limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum allowed size is 10MB." }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name.split(".").pop();
  const key = `resumes/${candidateId}.${fileExt}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json({ error: "Upload failed", details: error }, { status: 500 });
  }
} 