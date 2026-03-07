import { createAgent, UIInsightsFeat, VisionFeat } from '@synapsenodes/core';
import { z } from 'zod';

// Force the edge runtime for better performance and AI SDK streaming compatibility
// export const runtime = 'edge';

// We instantiate the AxonAgent backend execution loop here
const agent = createAgent({
  llmProvider: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  systemPrompt: "You are Axon, a helpful Next.js developer assistant. ALWAYS use the provided tools if the user asks for real-world data like weather or server status. Keep your responses concise and styled with markdown.",
  model: 'llama-3.3-70b-versatile',
  maxSteps: 5
});

// Load the Feats
agent.loadFeat(UIInsightsFeat);
agent.loadFeat(VisionFeat);

// Register production-grade mock tools to demonstrate the backend functionality
agent.registerTool({
  name: 'getRealtimeWeather',
  description: 'Fetches the live weather for a given city.',
  schema: z.object({
    city: z.string().describe('The name of the city, e.g. London or New York')
  }) as z.ZodTypeAny,
  execute: async ({ city }) => {
    console.log(`[Backend Tool] Fetching weather for ${city}...`);
    // Mock network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const conditions = ['Sunny', 'Stormy', 'Overcast', 'Raining Cats and Dogs'];
    const temp = Math.floor(Math.random() * 40);
    return {
      status: 'success',
      data: {
        city,
        temperatureC: temp,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: Math.floor(Math.random() * 100) + '%'
      }
    };
  }
});

agent.registerTool({
  name: 'checkServerStatus',
  description: 'Pings the main production database to check if it is online.',
  schema: z.object({
      region: z.string().describe('The AWS region to check, e.g. us-east-1')
  }) as z.ZodTypeAny,
  execute: async ({ region }) => {
     console.log(`[Backend Tool] Pinging database in ${region}...`);
     await new Promise(resolve => setTimeout(resolve, 1200));
     
     // 10% chance to simulate a database outage
     const isOnline = Math.random() > 0.1;
     return {
         status: isOnline ? 'OPERATIONAL' : 'OUTAGE',
         latency: isOnline ? `${Math.floor(Math.random() * 40) + 10}ms` : 'TIMEOUT',
         region
     }
  }
});

export async function POST(req: Request) {
  try {
    const { messages, domElements } = await req.json();

    // The agent now natively accepts the CoreMessage array format!
    // We inject the live DOM state as a system-level hidden message 
    // simply so the LLM context window knows what buttons currently exist
    let runMessages = [...messages];
    if (domElements && domElements.length > 0) {
       runMessages.unshift({
           role: 'system',
           content: `Current Live DOM State:\n${JSON.stringify(domElements, null, 2)}\n\nYou can use the interactWithScreen tool to click buttons or type into inputs based on 'elementId'.`
       });
    }

    const result = await agent.run(runMessages);

    // AI SDK's useChat expects a specific return signature for non-streaming endpoints
    return new Response(JSON.stringify({ 
        messages: [
            ...messages,
            { role: 'assistant', content: result.text },
            // Attach the raw tool call payloads so the frontend can intercept the UI_INTERACTION signal!
            ...((result.toolCalls && result.toolCalls.length > 0) ? [{ role: 'assistant' as const, content: '', toolCalls: result.toolCalls }] : [])
        ] 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
