import { SetMetadata } from '@nestjs/common';

export const SKIP_ENVELOPE_METADATA_KEY = 'skipEnvelope';

export const SkipEnvelope = () => SetMetadata(SKIP_ENVELOPE_METADATA_KEY, true);
