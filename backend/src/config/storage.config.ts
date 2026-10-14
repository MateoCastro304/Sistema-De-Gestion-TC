import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local',
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION,
}));
