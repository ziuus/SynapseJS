import { z } from 'zod';
import { tool } from 'ai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jsonSchema } from 'ai';

async function test() {
  const myZodSchema = z.object({ arg1: z.string() });
  
  // Use zodToJsonSchema to statically parse the schema
  const parsedJsonSchema = zodToJsonSchema(myZodSchema);

  const testTool = tool({
    description: 'A test tool.',
    parameters: jsonSchema(parsedJsonSchema), // Use Vercel's built-in jsonSchema function to bypass asSchema checks
  });

  console.log('Mapped tool:', Object.keys(testTool));
  console.log('Has parameters property?', !!testTool.parameters);
  console.log('Does parameter look like jsonSchema?', typeof testTool.parameters === 'object');
  console.log('Test Tool raw:', testTool);
}

test().catch(console.error);
