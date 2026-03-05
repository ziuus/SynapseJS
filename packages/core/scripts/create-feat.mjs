#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATS_DIR = path.resolve(__dirname, '../src/feats');

const featName = process.argv[2];

if (!featName) {
  console.error('Usage: npm run create-feat <feat-name>');
  process.exit(1);
}

const kebabName = featName.toLowerCase().replace(/\s+/g, '-');
const camelName = featName.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
  return index === 0 ? word.toLowerCase() : word.toUpperCase();
}).replace(/\s+/g, '');
const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);

const featFilePath = path.join(FEATS_DIR, `${kebabName}.ts`);

const template = `import { SynapseFeat, Tool } from '../types';
import { z } from 'zod';

/**
 * ${featName} Feat
 */
export const ${pascalName}Feat: SynapseFeat = {
  manifest: {
    name: '${featName}',
    version: '1.0.0',
    description: 'Describe your new feat here.',
    author: 'Developer',
    tags: ['custom']
  },
  instructions: 'Provide specific AI instructions for this feat here.',
  tools: [
    {
      name: '${camelName}Tool',
      description: 'A sample tool provided by the ${featName} feat.',
      schema: z.object({
        param: z.string().describe('A sample parameter')
      }) as any,
      execute: async ({ param }: any) => {
        return {
          _synapseSignal: 'SHOW_NOTIFICATION',
          payload: {
            message: \`${featName} executed with param: \${param}\`,
            type: 'success'
          }
        };
      }
    }
  ]
};
`;

if (fs.existsSync(featFilePath)) {
  console.error(`Error: Feat "${featName}" already exists at ${featFilePath}`);
  process.exit(1);
}

fs.writeFileSync(featFilePath, template);
console.log(`Created Feat boilerplate at: ${featFilePath}`);

// Update index.ts
const indexPath = path.join(FEATS_DIR, 'index.ts');
const exportLine = `export * from './${kebabName}';\n`;
if (!fs.readFileSync(indexPath, 'utf8').includes(exportLine)) {
  fs.appendFileSync(indexPath, exportLine);
  console.log(`Added export to ${indexPath}`);
}
