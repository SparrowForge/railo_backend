import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';

import { AwsConfigService } from '../config/aws-config.service';

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly awsConfigService: AwsConfigService) {}

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder?: string,
  ): Promise<S3UploadResult> {
    try {
      const s3Client = this.awsConfigService.getS3Client();
      const bucketName = this.awsConfigService.getBucketName();

      // Create the S3 key (path)
      const key = folder ? `${folder}/${fileName}` : fileName;

      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
        // Make file publicly readable if needed
        // ACL: 'public-read',
      });

      await s3Client.send(uploadCommand);

      const baseUrl = this.awsConfigService.getS3BaseUrl();
      const url = `${baseUrl}/${key}`;

      this.logger.log(`File uploaded successfully to S3: ${key}`);

      return {
        key,
        url,
        bucket: bucketName,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error uploading file to S3: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to upload file to S3: ${errorMessage}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const s3Client = this.awsConfigService.getS3Client();
      const bucketName = this.awsConfigService.getBucketName();

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(deleteCommand);
      this.logger.log(`File deleted successfully from S3: ${key}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting file from S3: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to delete file from S3: ${errorMessage}`);
    }
  }

  async getFileStream(key: string) {
    try {
      const s3Client = this.awsConfigService.getS3Client();
      const bucketName = this.awsConfigService.getBucketName();

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(getCommand);
      return response.Body;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error getting file from S3: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to get file from S3: ${errorMessage}`);
    }
  }

  async generatePresignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const s3Client = this.awsConfigService.getS3Client();
      const bucketName = this.awsConfigService.getBucketName();

      this.logger.debug(
        `Generating presigned URL for key: ${key}, bucket: ${bucketName}, expiresIn: ${expiresIn}`,
      );

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      this.logger.debug(`Presigned URL generated successfully: ${url}`);
      return url;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error generating presigned URL: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to generate presigned URL: ${errorMessage}`);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const s3Client = this.awsConfigService.getS3Client();
      const bucketName = this.awsConfigService.getBucketName();

      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(headCommand);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async uploadThumbnail(
    thumbnailBuffer: Buffer,
    originalFileName: string,
    folder?: string,
  ): Promise<S3UploadResult> {
    const thumbnailFileName = this.generateThumbnailFileName(originalFileName);
    const thumbnailFolder = folder ? `${folder}/thumbnails` : 'thumbnails';

    return this.uploadFile(
      thumbnailBuffer,
      thumbnailFileName,
      'image/jpeg',
      thumbnailFolder,
    );
  }

  private generateThumbnailFileName(originalFileName: string): string {
    const nameWithoutExt = originalFileName.substring(
      0,
      originalFileName.lastIndexOf('.'),
    );
    return `${nameWithoutExt}_thumb.jpg`;
  }
}
