import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@api/_utils/auth/roles.constants';

export const ROLES_METADATA_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);
