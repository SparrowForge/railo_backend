/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp = require('sharp');
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';

import { FileResponseDto } from './dto/file-response.dto';
import { FilterFilesDto } from './dto/filter-files.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { Files, FileType } from './entities/file.entity';
import { FileReference } from './entities/file-reference.entity';
import { S3Service } from './s3.service';

// import { Cron } from '@nestjs/schedule'; // Uncomment when @nestjs/schedule is installed

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(Files)
    private readonly fileRepository: Repository<Files>,
    @InjectRepository(FileReference)
    private readonly fileReferenceRepository: Repository<FileReference>,
    private readonly s3Service: S3Service,
  ) { }
  async uploadFile(
    file: any, // Using any for now to avoid type issues
    uploadFileDto: UploadFileDto,
  ): Promise<FileResponseDto> {
    // Validate file
    this.validateFile(file, uploadFileDto.file_type);
    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalname || '');
    const fileName = `${timestamp}_${uploadFileDto.entity_type}_${uploadFileDto.entity_id}${extension}`;

    // Create folder structure for S3
    const folder = `${uploadFileDto.entity_type}/${uploadFileDto.entity_id}`;

    try {
      // Upload file to S3
      const uploadResult = await this.s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype || 'application/octet-stream',
        folder,
      );
      console.log('uploadResult:', uploadResult);

      // Generate thumbnail if it's an image
      let thumbnailUrl: string | undefined = undefined;
      if (this.isImageFile(file.mimetype)) {
        const thumbnailFileName = `thumb_${fileName}`;
        const thumbnailFolder = `${folder}/thumbnails`;

        // Generate thumbnail buffer
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Upload thumbnail to S3
        await this.s3Service.uploadFile(
          thumbnailBuffer,
          thumbnailFileName,
          'image/jpeg',
          thumbnailFolder,
        );

        // Generate thumbnail URL
        const thumbnailKey = `${thumbnailFolder}/${thumbnailFileName}`;
        thumbnailUrl = await this.s3Service.generatePresignedUrl(
          thumbnailKey,
          3600,
        ); // 1 hour expiry
      }

      // Create file record
      const fileRecord = this.fileRepository.create({
        file_name: fileName,
        original_name: file.originalname || '',
        file_path: uploadResult.key, // Store S3 key instead of local file path
        file_size: file.size || 0,
        mime_type: file.mimetype || 'application/octet-stream',
        file_type: uploadFileDto.file_type,
        file_category: uploadFileDto.file_category,
        uploaded_by: uploadFileDto.uploadedBy,
        public_url: uploadResult.url,
      });

      const savedFile = await this.fileRepository.save(fileRecord);

      // Create file reference
      const fileReference = this.fileReferenceRepository.create({
        file_id: savedFile.id,
        resource: uploadFileDto.entity_type,
        resource_id: uploadFileDto.entity_id,
        reference_type: uploadFileDto.file_type,
      });

      await this.fileReferenceRepository.save(fileReference);

      // Generate presigned URL for file access
      const fileUrl = await this.s3Service.generatePresignedUrl(
        uploadResult.key,
        3600,
      ); // 1 hour expiry

      // Return response

      return {
        success: true,
        file_id: savedFile.id,
        file_url: fileUrl, // S3 presigned URL
        thumbnail_url: thumbnailUrl,
        original_name: savedFile.original_name,
        file_name: savedFile.file_name,
        file_size: savedFile.file_size ?? 0,
        mime_type: savedFile.mime_type,
        file_type: savedFile.file_type,
        file_category: savedFile.file_category,
        message: 'File uploaded successfully to S3',
        public_url: uploadResult.url,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findOne(id: number): Promise<Files> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async findByFilename(filename: string): Promise<Files | null> {
    return this.fileRepository.findOne({
      where: { file_name: filename },
      relations: ['uploadedBy'],
    });
  }

  async getFileStream(file: Files) {
    // For S3 files, use S3Service to get stream
    return this.s3Service.getFileStream(file.file_path);
  }

  async generateFileUrl(file: Files, expiresIn: number = 3600): Promise<string> {
    // Generate presigned URL for S3 file access
    return this.s3Service.generatePresignedUrl(file.file_path, expiresIn);
  }

  async deleteFile(id: number): Promise<void> {
    const file = await this.findOne(id);

    // Delete from S3
    await this.s3Service.deleteFile(file.file_path);

    // Delete file references
    await this.fileReferenceRepository.delete({ file_id: id });

    // Delete file record
    await this.fileRepository.delete(id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterFilesDto>,
  ): Promise<PaginatedResponseDto<Files>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .skip(skip)
      .take(limit)
      .orderBy('file.file_name', 'ASC')
      .where('file.deleted_at IS NULL');

    // Build where conditions

    if (filters?.file_name) {
      qb.andWhere('file.file_name = :file_name', {
        file_name: filters.file_name,
      });
    }

    if (filters?.file_type) {
      qb.andWhere('file.file_type = :file_type', {
        file_type: filters.file_type,
      });
    }

    if (filters?.search) {
      qb.andWhere(
        'file.file_name LIKE :search OR file.original_name LIKE :search',
        { search: `%${filters.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findByEntity(entityType: string, entityId: number): Promise<Files[]> {
    const references = await this.fileReferenceRepository.find({
      where: { resource: entityType, resource_id: entityId },
      relations: ['file'],
    });

    return references.map((ref) => ref.file);
  }

  async findByEntityAndType(
    entityType: string,
    entityId: number,
    fileType: string,
  ): Promise<Files[]> {
    const references = await this.fileReferenceRepository.find({
      where: {
        resource: entityType,
        resource_id: entityId,
        reference_type: fileType,
      },
      relations: ['file'],
    });

    return references.map((ref) => ref.file);
  }

  async removeFileReference(
    entityType: string,
    entityId: number,
    fileType: string,
  ): Promise<void> {
    const reference = await this.fileReferenceRepository.findOne({
      where: {
        resource: entityType,
        resource_id: entityId,
        reference_type: fileType,
      },
    });

    if (reference) {
      await this.fileReferenceRepository.remove(reference);
    }
  }

  // Automatic cleanup of orphaned files
  // @Cron('0 2 * * *') // Run daily at 2 AM - uncomment when @nestjs/schedule is installed
  async cleanupOrphanedFiles() {
    console.log('Starting orphaned file cleanup...');

    try {
      // Find files that exist but have no active references
      const orphanedFiles = await this.fileRepository
        .createQueryBuilder('f')
        .leftJoin('file_references', 'fr', 'fr.file_id = f.id')
        .where('fr.id IS NULL')
        .andWhere('f.deleted_at IS NULL')
        .getMany();

      console.log(`Found ${orphanedFiles.length} orphaned files`);

      for (const file of orphanedFiles) {
        try {
          // Delete physical file
          await this.deletePhysicalFile(file.file_path);

          // Mark as deleted in database
          file.deleted_at = new Date();
          await this.fileRepository.save(file);

          console.log(`Cleaned up orphaned file: ${file.file_name}`);
        } catch (error) {
          console.error(`Error cleaning up file ${file.id}:`, error);
        }
      }

      console.log('Orphaned file cleanup completed');
    } catch (error) {
      console.error('Error during orphaned file cleanup:', error);
    }
  }

  private validateFile(file: any, fileType: FileType): void {
    // Check file size based on file type
    const maxSize = this.getMaxFileSize(fileType);
    if ((file.size || 0) > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `File size exceeds maximum allowed size (${maxSizeMB}MB) for file type: ${fileType}`,
      );
    }

    // Check file type based on file type
    const allowedMimeTypes = this.getAllowedMimeTypes(fileType);
    if (!allowedMimeTypes.includes(file.mimetype || '')) {
      console.log(`File validation failed:`, {
        detectedMimeType: file.mimetype,
        expectedFileType: fileType,
        allowedMimeTypes: allowedMimeTypes,
        fileName: file.originalname,
      });
      throw new BadRequestException(
        `File type not allowed for type: ${fileType}. Detected MIME type: ${file.mimetype || 'unknown'}. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private getMaxFileSize(fileType: FileType): number {
    switch (fileType) {
      case FileType.PHOTO:
        return 5 * 1024 * 1024; // 5MB for images
      case FileType.VIDEO:
        return 100 * 1024 * 1024; // 100MB for videos
      case FileType.DOCUMENT:
      case FileType.RECEIPT:
        return 20 * 1024 * 1024; // 20MB for documents
      default:
        return 50 * 1024 * 1024; // 50MB default
    }
  }

  private getAllowedMimeTypes(fileType: FileType): string[] {
    switch (fileType) {
      case FileType.PHOTO:
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      case FileType.VIDEO:
        return [
          'video/mp4',
          'video/mpeg',
          'video/quicktime', // .mov
          'video/x-quicktime', // Alternative MOV MIME type
          'application/octet-stream', // Sometimes MOV files are detected as this
          'video/webm',
          'video/x-msvideo', // .avi
          'video/x-ms-wmv', // .wmv
        ];

      case FileType.OTHER:
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
        ];

      case FileType.DOCUMENT:
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
        ];

      case FileType.RECEIPT:
        return ['application/pdf', 'image/jpeg', 'image/png'];

      default:
        return [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete physical file ${filePath}:`, error);
    }
  }

  private async generateThumbnail(
    filePath: string,
    uploadDir: string,
    fileName: string,
  ): Promise<string> {
    const thumbnailDir = path.join(uploadDir, 'thumbnails');
    await this.ensureDirectoryExists(thumbnailDir);

    const thumbnailFileName = `${path.basename(fileName, path.extname(fileName))}_thumb${path.extname(fileName)}`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);

    await sharp(filePath)
      .resize(200, 200) // Example dimensions, adjust as needed
      .toFormat('jpeg')
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  private isImageFile(mimeType: string | undefined): boolean {
    if (!mimeType) {
      return false;
    }
    return mimeType.startsWith('image/');
  }
}
