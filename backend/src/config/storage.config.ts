import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local',
  s3Region: process.env.S3_REGION,
  // Sin endpoint, el SDK usa el de AWS para la region.
  s3Endpoint: process.env.S3_ENDPOINT,
  // El que va en las presigned URLs: lo usa el navegador, no el backend.
  s3PublicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  s3Bucket: process.env.S3_BUCKET,
  s3BucketUploads: process.env.S3_BUCKET_UPLOADS,
  // Sin keys, el SDK busca el IAM Role de la maquina (prod).
  s3AccessKeyId: process.env.S3_BACKEND_ACCESS_KEY,
  s3SecretAccessKey: process.env.S3_BACKEND_SECRET_KEY,
}));
