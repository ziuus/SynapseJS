import { tool, generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

async function main() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.VITE_GEMINI_API_KEY as string,
  });

  const tools = {
    getWeather: tool({
      description: 'Gets the current weather for a specific location.',
      inputSchema: z.object({
        location: z.string().describe("The city or region to get weather for")
      }),
    }),
    sendTextMessage: tool({
      description: 'Sends a text message to a specific contact.',
      inputSchema: z.object({
        recipient: z.string().describe("The name of the person to text (e.g., Alice)"),
        message: z.string().describe("The exact text message content to send")
      }),
    })
  };

  try {
    const response = await generateText({
      model: google('gemini-2.5-flash'),
      system: 'You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request. YOU MUST PASS ALL REQUIRED ARGUMENTS FOR TOOLS.',
      prompt: 'What is the weather in Tokyo? Text the weather to Alice.',
      tools,
    });
    console.log(`Tool calls:`, JSON.stringify(response.toolCalls, null, 2));
    console.log(`Agent response:`, response.text);
  } catch (e: any) {
    console.error(e.message);
  }
}

main().catch(console.error);
