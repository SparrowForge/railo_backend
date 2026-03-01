/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

import { Public } from '../common/decorators/public.decorator';
import { FileResponseDto } from './dto/file-response.dto';
import { FilterFilesDto } from './dto/filter-files.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { Files, FileCategory, FileType } from './entities/file.entity';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('api/v1/files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
  constructor(
    private configService: ConfigService,
    private readonly filesService: FilesService) { }

  @Post('upload')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Uploads a file and associates it with an entity (student, faculty, course, etc.). Returns file_id and file_url for further use.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
        file_type: {
          type: 'string',
          enum: Object.values(FileType),
          description:
            'Type of file (profile_picture, document, receipt, etc.)',
          example: FileType.PHOTO,
        },
        file_category: {
          type: 'string',
          enum: Object.values(FileCategory),
          description:
            'Category of file (personal, financial, medical, administrative, etc.)',
          example: FileCategory.FINANCIAL,
        },
        entity_type: {
          type: 'string',
          description:
            'Type of entity this file belongs to (e.g., "users", "courses")',
          example: 'inventory',
        },
        entity_id: {
          type: 'number',
          description: 'ID of the entity this file belongs to',
          example: 123,
        },
        uploadedBy: {
          type: 'number',
          description: 'User id',
          example: 39,
        },
      },
      required: ['file', 'file_type', 'file_category', 'entity_type'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - invalid file type, size, or missing required fields',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error during file upload',
  })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /image\/(png|jpeg|jpg|gif)|application\/pdf|video\/(mp4|quicktime)/,
            fallbackToMimetype: true, // Crucial for resolving identical-type errors
          })
        ],
      }),
    )
    file: any, // Using any for now to avoid type issues
    @Body() uploadFileDto: UploadFileDto,
    @Req() req: Request,
  ): Promise<BaseResponseDto<FileResponseDto>> {
    if (!req.headers["x-api-key"]) {
      throw new UnauthorizedException();
    }

    if (String(req.headers["x-api-key"]) !== String(this.configService.get('FILE_UPLOAD_KEY'))) {
      throw new UnauthorizedException();
    }

    const res = await this.filesService.uploadFile(file, uploadFileDto);
    return new BaseResponseDto(res, 'File uploaded successfully');
  }

  @Get()
  @ApiOperation({
    summary: 'Get all files',
    description: 'Retrieves all files with optional pagination and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of files per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'file_type',
    required: false,
    enum: FileType,
    description: 'Filter by file type',
    example: FileType.PHOTO,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by file name or original name',
    example: 'document',
  })
  @ApiQuery({
    name: 'file_name',
    required: false,
    type: String,
    description: 'Filter by exact file name',
    example: 'document.pdf',
  })
  @ApiOkResponse({
    description: 'Files retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/File' },
        },
        total: {
          type: 'number',
          description: 'Total number of files',
        },
        page: {
          type: 'number',
          description: 'Current page number',
        },
        limit: {
          type: 'number',
          description: 'Number of files per page',
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'List of files',
    type: BaseResponseDto<PaginatedResponseDto<Files>>,
  })
  async findAll(@Query() filters: FilterFilesDto) {
    // Validate and sanitize pagination parameters
    const { page, limit, ...rest } = filters;
    const pagination = { page, limit };
    const result = await this.filesService.findAll(pagination, rest);
    return new BaseResponseDto(result, 'Files retrieved');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get file by ID',
    description: 'Retrieves file information by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'File ID',
    example: 456,
  })
  @ApiOkResponse({
    description: 'File retrieved successfully',
    type: Files,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file ID',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Files> {
    return await this.filesService.findOne(id);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get files by entity',
    description:
      'Retrieves all files associated with a specific entity (student, faculty, course, etc.)',
  })
  @ApiParam({
    name: 'entityType',
    type: String,
    description: 'Type of entity (e.g., "users", "courses")',
    example: 'students',
  })
  @ApiParam({
    name: 'entityId',
    type: Number,
    description: 'ID of the entity',
    example: 123,
  })
  @ApiQuery({
    name: 'fileType',
    required: false,
    type: String,
    description: 'Filter by file type (optional)',
    example: 'profile_picture',
  })
  @ApiOkResponse({
    description: 'Files retrieved successfully',
    type: [Files],
  })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Query('fileType') fileType?: string,
  ): Promise<Files[]> {
    if (fileType) {
      return await this.filesService.findByEntityAndType(
        entityType,
        entityId,
        fileType,
      );
    }
    return await this.filesService.findByEntity(entityType, entityId);
  }

  @Get('serve/:filename')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Serve a file',
    description: 'Serves a file by filename with proper headers and caching',
  })
  @ApiParam({
    name: 'filename',
    description: 'Filename of the file to serve',
    example: '1234567890_users_123_profile.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'File served successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const file = await this.filesService.findByFilename(filename);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Generate presigned URL for S3 file access
      const presignedUrl = await this.filesService.generateFileUrl(file, 3600);

      // Redirect to the presigned URL
      return res.redirect(presignedUrl);
    } catch (error) {
      this.logger.error(`Error in serveFile: ${error}`, error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('download/:filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download a file',
    description: 'Downloads a file by filename with download headers',
  })
  @ApiParam({
    name: 'filename',
    description: 'Filename of the file to download',
    example: '1234567890_users_123_assignment.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      console.log('Downloading file:', filename);

      const file = await this.filesService.findByFilename(filename);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Generate presigned URL for S3 file download with proper headers
      const presignedUrl = await this.filesService.generateFileUrl(file, 3600);

      // Set download headers and redirect
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.original_name}"`,
      );

      return res.redirect(presignedUrl);
    } catch (error) {
      console.error('Error in downloadFile:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Post('header-data-test')
  @Public()
  getHeaderDataInReturn(@Req() req: Request) {
    return req.headers["x-api-key"];
  }
}
