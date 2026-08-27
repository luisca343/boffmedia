import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { WingullModule } from '../wingull/wingull.module';
import { AuditService } from '@api/_repositories/audit.service';
import { StarbankAccountRepository } from '../starbank/repositories/starbank-account.repository';
import { StarbankTransactionRepository } from '../starbank/repositories/starbank-transaction.repository';

// Shared
import { AuditoriaRepository } from './_shared/auditoria.repository';
import { AuditoriaService } from './_shared/auditoria.service';
import { PeopleRepository } from './_shared/people.repository';
import { CountersRepository } from './_shared/counters.repository';
import { CountersService } from './_shared/counters.service';
import { StarbankHouseAccountService } from '../starbank/services/starbank-house-account.service';
import { TreasuryService } from './_shared/treasury.service';

// Urbanismo
import { UrbanismoRepository } from './urbanismo/urbanismo.repository';
import { UrbanismoService } from './urbanismo/urbanismo.service';
import { UrbanismoController } from './urbanismo/urbanismo.controller';

// Seguridad
import { SeguridadRepository } from './seguridad/seguridad.repository';
import { SeguridadService } from './seguridad/seguridad.service';
import { SeguridadController } from './seguridad/seguridad.controller';

// Hacienda
import { HaciendaRepository } from './hacienda/hacienda.repository';
import { HaciendaService } from './hacienda/hacienda.service';
import { HaciendaController } from './hacienda/hacienda.controller';

// Justicia
import { JusticiaRepository } from './justicia/justicia.repository';
import { JusticiaService } from './justicia/justicia.service';
import { JusticiaController } from './justicia/justicia.controller';

// Poblacion
import { PoblacionRepository } from './poblacion/poblacion.repository';
import { PoblacionService } from './poblacion/poblacion.service';
import { PoblacionController } from './poblacion/poblacion.controller';

// General (anuncios / auditoria / counters)
import { GeneralRepository } from './general/general.repository';
import { GeneralService } from './general/general.service';
import { GeneralController } from './general/general.controller';

// Eventos
import { EventosRepository } from './eventos/eventos.repository';
import { EventosService } from './eventos/eventos.service';
import { EventosController } from './eventos/eventos.controller';

// Administracion
import { AdministracionRepository } from './administracion/administracion.repository';
import { AdministracionService } from './administracion/administracion.service';
import { AdministracionController } from './administracion/administracion.controller';

@Module({
  imports: [DrizzleModule, WingullModule],
  controllers: [
    UrbanismoController,
    SeguridadController,
    HaciendaController,
    JusticiaController,
    PoblacionController,
    GeneralController,
    EventosController,
    AdministracionController,
  ],
  providers: [
    // Unified audit service across all domains
    AuditService,

    // Reused directly from StarBank (fresh instances, same DB) so TreasuryService can settle
    // real transactions without StarbankModule needing to export its internal tokens.
    {
      provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
      useClass: StarbankAccountRepository,
    },
    {
      provide: STARBANK_TRANSACTION_REPOSITORY_TOKEN,
      useClass: StarbankTransactionRepository,
    },

    AuditoriaRepository,
    AuditoriaService,
    PeopleRepository,
    CountersRepository,
    CountersService,
    StarbankHouseAccountService,
    TreasuryService,

    UrbanismoRepository,
    UrbanismoService,

    SeguridadRepository,
    SeguridadService,

    HaciendaRepository,
    HaciendaService,

    JusticiaRepository,
    JusticiaService,

    PoblacionRepository,
    PoblacionService,

    GeneralRepository,
    GeneralService,

    EventosRepository,
    EventosService,

    AdministracionRepository,
    AdministracionService,
  ],
})
export class GobiernoModule {}
