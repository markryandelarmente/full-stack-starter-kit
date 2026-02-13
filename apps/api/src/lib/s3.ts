import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  GetObjectCommand,
  GetBucketPolicyCommand,
  DeleteBucketPolicyCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { validateServerEnv } from '../env';

let s3Client: S3Client | null = null;

/**
 * Get or create S3 client instance
 */
export function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const env = validateServerEnv();
  const endpoint = `http${env.S3_USE_SSL ? 's' : ''}://${env.S3_ENDPOINT}`;

  s3Client = new S3Client({
    endpoint,
    region: 'us-east-1', // Default region (can be overridden for real S3)
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO and some S3-compatible services
  });

  return s3Client;
}

/**
 * Ensure bucket exists, create if it doesn't
 * Sets bucket policy for public read access only for public files
 */
export async function ensureBucketExists(bucketName: string, isPrivateFile = false): Promise<void> {
  const client = getS3Client();

  try {
    // Check if bucket exists
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch {
    // Bucket doesn't exist, create it
    try {
      await client.send(
        new CreateBucketCommand({
          Bucket: bucketName,
        })
      );
    } catch (createError) {
      throw new Error(`Failed to create bucket ${bucketName}: ${createError}`);
    }
  }

  // Only set bucket policy for public files to allow public read access
  // For private files, we don't set a bucket policy (rely on ACL: 'private')
  // This way, public files can be accessed directly, while private files require presigned URLs
  if (!isPrivateFile) {
    try {
      const publicReadPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadGetObject',
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await client.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(publicReadPolicy),
        })
      );
    } catch {
      // If setting bucket policy fails, log but don't throw
      // Public files may not be accessible if bucket policy fails
    }
  } else {
    // For private files, remove any existing bucket policy to allow ACL to work
    try {
      await client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
      await client.send(new DeleteBucketPolicyCommand({ Bucket: bucketName }));
    } catch {
      // No policy exists, that's fine
    }
  }

  // NOTE: We conditionally set bucket policy:
  // - For public files: Set bucket policy to allow public read access
  // - For private files: Remove bucket policy to allow ACL: 'private' to work
  // This approach has limitations: if you upload a public file after a private file,
  // the bucket policy will be set, making all files public. Consider using separate
  // buckets for public/private files for better isolation.
}

/**
 * Upload file to S3
 */
export async function uploadFileToS3(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
  isPrivate = false
): Promise<string> {
  const client = getS3Client();

  await ensureBucketExists(bucket, isPrivate);

  const ACL = isPrivate ? 'private' : 'public-read';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL,
  });

  await client.send(command);

  // Return URL - for public files this should be accessible, for private files use presigned URLs
  const env = validateServerEnv();
  const protocol = env.S3_USE_SSL ? 'https' : 'http';
  // For MinIO with path-style access, the URL format is: http://endpoint/bucket/key
  return `${protocol}://${env.S3_ENDPOINT}/${bucket}/${key}`;
}

/**
 * Delete file from S3
 */
export async function deleteFileFromS3(bucket: string, key: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Get file URL (public or presigned)
 */
export function getFileUrl(bucket: string, key: string): string {
  const env = validateServerEnv();
  const protocol = env.S3_USE_SSL ? 'https' : 'http';
  return `${protocol}://${env.S3_ENDPOINT}/${bucket}/${key}`;
}

/**
 * Generate a presigned URL for private file access
 * @param bucket S3 bucket name
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL that allows temporary access to the file
 */
export async function getPresignedUrl(
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}
