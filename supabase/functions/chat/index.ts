import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for AI function calling
const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information, news, facts, or anything the user wants to know about. Use this when the user asks about recent events, unknown topics, current data, or needs up-to-date information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to look up on the web"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_location",
      description: "Get geographic coordinates and information about a place, location, landmark, city, or address. Use this when the user asks about a specific place, wants to see something on a map, or needs location details.",
      parameters: {
        type: "object",
        properties: {
          places: {
            type: "array",
            items: { type: "string" },
            description: "List of place names to look up"
          },
          include_directions: {
            type: "boolean",
            description: "Whether to include directions between places"
          }
        },
        required: ["places"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather information for a location. Use this when the user asks about weather, temperature, forecast, or climate conditions.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location to get weather for"
          }
        },
        required: ["location"]
      }
    }
  }
];

// Execute web search using Gemini with grounding
async function executeWebSearch(query: string, apiKey: string): Promise<string> {
  console.log("Executing web search:", query);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a web search assistant. Search for and provide accurate, up-to-date information with citations. Format sources as [Source Name](URL) when available." 
        },
        { role: "user", content: query }
      ],
      tools: [{ "googleSearch": {} }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Web search error:", errorText);
    return `I couldn't complete the web search at this time.`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No search results found.";
}

// Get location coordinates
async function getLocationData(places: string[], includeDirections: boolean, apiKey: string): Promise<any> {
  console.log("Getting location data for:", places);
  
  const systemPrompt = `You are a geography expert. For each place provided, return accurate geographic coordinates.

Respond with a JSON object in this exact format:
{
  "message": "Brief description of the locations",
  "locations": [
    {
      "name": "Place Name",
      "lat": 40.7128,
      "lng": -74.0060,
      "description": "Brief description",
      "type": "city|landmark|restaurant|etc"
    }
  ],
  "center": { "lat": 40.7128, "lng": -74.0060 },
  "zoom": 12
  ${includeDirections ? ', "route": { "from": "Start", "to": "End" }' : ''}
}

IMPORTANT: Only respond with valid JSON. No markdown code blocks.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Find these locations: ${places.join(", ")}` }
      ],
    }),
  });

  if (!response.ok) {
    return { message: "Couldn't find location data.", locations: [] };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
    else if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
    if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
    return JSON.parse(cleanContent.trim());
  } catch {
    return { message: content, locations: [] };
  }
}

// Get weather data
async function getWeatherData(location: string, apiKey: string): Promise<string> {
  console.log("Getting weather for:", location);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a weather assistant. Provide current weather information including temperature, conditions, humidity, and any relevant weather alerts. Be concise and accurate." 
        },
        { role: "user", content: `What is the current weather in ${location}?` }
      ],
      tools: [{ "googleSearch": {} }]
    }),
  });

  if (!response.ok) {
    return `I couldn't retrieve weather data for ${location} at this time.`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || `Weather data unavailable for ${location}.`;
}

// Process messages to handle images for vision
function processMessagesForVision(messages: any[]): any[] {
  return messages.map((msg: any) => {
    if (msg.role === "user" && typeof msg.content === "string") {
      // Check if the message contains base64 image data
      const base64ImageRegex = /data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/=]+)/g;
      const matches = [...msg.content.matchAll(base64ImageRegex)];
      
      if (matches.length > 0) {
        console.log("Found", matches.length, "images in message");
        
        // Extract text content (remove base64 data and cleanup)
        let textContent = msg.content;
        textContent = textContent.replace(base64ImageRegex, '').trim();
        textContent = textContent.replace(/\[Image:.*?\]\nAnalyze this image:/g, '').trim();
        textContent = textContent.replace(/\[Attached files context\]\n?/g, '').trim();
        textContent = textContent.replace(/\[User message\]\n?/g, '').trim();
        textContent = textContent.replace(/\[File Type:.*?\]\n?/g, '').trim();
        textContent = textContent.replace(/\n{2,}/g, '\n').trim();
        
        // Build multimodal content array
        const content: any[] = [];
        
        // Add images first
        for (const match of matches) {
          const mimeType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${match[2]}`
            }
          });
        }
        
        // Add text content
        content.push({
          type: "text",
          text: textContent || "Please analyze this image and describe what you see in detail."
        });
        
        console.log("Created multimodal message with", matches.length, "images and text:", textContent.substring(0, 100));
        return { role: msg.role, content };
      }
    }
    return msg;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat request - mode:", mode, "messages:", messages.length);

    // Build system prompt based on mode
    const fileHandlingInstructions = `
When files are attached:
1. First identify the file type from its extension (e.g., .jpg, .py, .txt)
2. State the file type clearly (e.g., "This is a Python script" or "This is a JPEG image")
3. For text/code files: Read and analyze the content, then respond to the user's question about it
4. For images: Analyze the image content and describe what you see in detail
5. Always relate your analysis to the user's specific question or request`;

    const systemPrompts: Record<string, string> = {
      chat: `You are Lepen AI, a helpful and intelligent assistant. Provide clear, concise, and helpful responses.
${fileHandlingInstructions}

You have access to these tools which you should use automatically when needed:
- web_search: Use for current events, unknown topics, or when you need up-to-date information
- get_location: Use when user mentions places, locations, or wants to see something on a map
- get_weather: Use when user asks about weather, temperature, or climate

Use tools proactively without telling the user. Just provide the information naturally.`,
      
      code: `You are Lepen AI Build Assistant. Help users design, write, debug, and explain code.
${fileHandlingInstructions}

Provide clean, well-documented code examples with explanations. Wrap code in markdown code blocks with the language specified.

You have access to tools (web_search, get_location, get_weather) - use them when needed for code examples or information.`,
      
      images: `You are Lepen AI Image Assistant. Help users refine their image prompts and describe what kind of images they want to create.
${fileHandlingInstructions}

When analyzing uploaded images, describe them in detail including colors, composition, subjects, style, and mood.

You have access to web_search if you need reference information for image prompts.`,
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;
    const model = mode === "images" ? "google/gemini-2.5-flash" : "google/gemini-3-pro-preview";

    // Process messages to handle images properly
    const processedMessages = processMessagesForVision(messages);

    // First call to check if tools are needed
    const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        tools: mode !== "images" ? tools : undefined,
        tool_choice: mode !== "images" ? "auto" : undefined,
      }),
    });

    if (!initialResponse.ok) {
      if (initialResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (initialResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await initialResponse.text();
      console.error("AI gateway error:", initialResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    // Check if tool calls are requested
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("Tool calls requested:", assistantMessage.tool_calls);
      
      const toolResults: any[] = [];
      let mapData = null;
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        
        let result: string | any = "";
        
        if (functionName === "web_search") {
          result = await executeWebSearch(args.query, LOVABLE_API_KEY);
        } else if (functionName === "get_location") {
          const locationData = await getLocationData(args.places || [], args.include_directions || false, LOVABLE_API_KEY);
          mapData = locationData;
          result = JSON.stringify(locationData);
        } else if (functionName === "get_weather") {
          result = await getWeatherData(args.location, LOVABLE_API_KEY);
        }
        
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: typeof result === "string" ? result : JSON.stringify(result)
        });
      }

      // Make final call with tool results
      const finalMessages = [
        { role: "system", content: systemPrompt },
        ...processedMessages,
        assistantMessage,
        ...toolResults
      ];

      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: finalMessages,
          stream: true,
        }),
      });

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error("Final response error:", errorText);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If we have map data, read stream and include map data in response
      if (mapData) {
        const reader = finalResponse.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  fullContent += parsed.choices?.[0]?.delta?.content || "";
                } catch {}
              }
            }
          }
        }

        return new Response(JSON.stringify({
          content: fullContent,
          mapData
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(finalResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls - stream regular response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("Stream error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});