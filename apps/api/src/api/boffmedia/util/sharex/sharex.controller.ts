import { randomString } from '@/_utils/stringUtils';
import { Public } from '@api/_utils/decorators/public.decorator';
import { env } from '@/config/env';
import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SharexTokensService } from './sharex-tokens.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { SharexService } from './sharex.service';
import { ApiTags } from '@nestjs/swagger';
import { SharexUploadDto } from './dto/sharex-upload.dto';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';

/** Image types only. The extension is what the file is SERVED as, so anything
 *  the browser will execute in this origin (html, svg, js, …) must stay out. */
const SHAREX_ALLOWED_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
]);
const SHAREX_MAX_BYTES = 25 * 1024 * 1024;

@ApiTags('BoffMedia 🛠 | ShareX')
@Public()
@Controller('sharex')
@SkipEnvelope()
export class SharexController {
  constructor(
    private readonly sharexService: SharexService,
    private readonly tokens: SharexTokensService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: SHAREX_MAX_BYTES, files: 1 },
    }),
  )
  async post(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SharexUploadDto,
  ) {
    // The route is @Public() because the uploader holds no session, so the
    // token IS the identity — this both authenticates the request and decides
    // whose upload it is. Resolved before anything touches the disk, and the
    // query excludes revoked tokens, so revocation takes effect immediately.
    const token = await this.tokens.resolve(body.key ?? '');
    if (!token) {
      throw new UnauthorizedException('Invalid or revoked ShareX token.');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileName = file.originalname ?? '';
    // Allow-list, never the caller's own extension: these files are written
    // under `public/` and served from this origin, so honouring an arbitrary
    // extension (.html, .svg, .js) would be stored XSS on the API's origin.
    const extension = (fileName.split('.').pop() ?? '').toLowerCase();
    if (!SHAREX_ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed: ${[...SHAREX_ALLOWED_EXTENSIONS].join(', ')}`,
      );
    }

    // `app` is a label only; clamp it to the column width and strip anything
    // that is not a plain identifier.
    const app = fileName
      .split('.')[0]
      .slice(0, -11)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 32);

    let newName = randomString(10);
    const dir = path.join(process.cwd(), 'public/smartrotom/img/sharex');

    while (fs.existsSync(path.join(dir, newName + '.' + extension))) {
      newName = randomString(10);
    }

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join(dir, newName + '.' + extension);
      fs.writeFileSync(filePath, file.buffer);

      await this.sharexService.createImage(app, newName, extension, token.id);
      // Best-effort: a failed stamp must not fail an upload that already landed.
      void this.tokens.touch(token.id).catch(() => undefined);

      return {
        file: {
          url: `${env.PUBLIC_DIR}/smartrotom/img/sharex/${newName}.${extension}`,
          name: newName + '.' + extension,
          size: file.size,
          type: file.mimetype,
        },
      };
    } catch (_error: any) {
      throw new InternalServerErrorException('Failed to save file');
    }
  }
}
