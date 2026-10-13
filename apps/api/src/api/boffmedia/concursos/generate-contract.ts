import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { generate } from 'openapi-typescript-codegen';
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from 'node:fs/promises';
import path from 'node:path';
import { ConcursosModule } from './concursos.module';

/** Generates this new domain's models from its Nest DTOs without booting database,
 * Discord or external integrations. The ordinary full generate:shared also sees
 * these same DTOs once the complete API is running. Never hand-edit the outputs. */
async function main() {
  const module = await Test.createTestingModule({
    imports: [ConcursosModule],
  }).compile();
  const app = module.createNestApplication();
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Concursos')
      .setVersion('0.1')
      .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'concursos-capability')
      .build(),
  );
  const root = path.resolve(__dirname, '../../../../../..');
  const temporary = path.join(root, 'docs/handoffs/concursos/generated');
  await mkdir(temporary, { recursive: true });
  await writeFile(path.join(temporary, 'api.json'), JSON.stringify(document));
  await generate({
    input: path.join(temporary, 'api.json'),
    output: temporary,
    exportModels: true,
    exportServices: false,
    exportCore: false,
  });
  const shared = path.join(root, 'packages/shared/src');
  const files = await readdir(path.join(temporary, 'models'));
  for (const file of files)
    await copyFile(
      path.join(temporary, 'models', file),
      path.join(shared, 'models', file),
    );
  const generatedIndex = await readFile(
    path.join(temporary, 'index.ts'),
    'utf8',
  );
  let index = await readFile(path.join(shared, 'index.ts'), 'utf8');
  for (const line of generatedIndex
    .split('\n')
    .filter((line) => line.startsWith('export '))) {
    if (!index.includes(line)) index += '\n' + line;
  }
  await writeFile(path.join(shared, 'index.ts'), index.trimEnd() + '\n');
  await app.close();
  console.log(
    `Generated ${files.length} Concursos models from Nest Swagger DTOs.`,
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
