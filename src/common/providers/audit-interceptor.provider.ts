import { Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AuditDatabaseInterceptor } from '../interceptors/audit-database.interceptor';

export const AuditInterceptorProvider: Provider = {
  provide: APP_INTERCEPTOR,
  useClass: AuditDatabaseInterceptor,
};
