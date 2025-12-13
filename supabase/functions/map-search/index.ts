import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Location {
  name: string;
  lat: number;
  lng: number;
  description?: string;
  type?: string;
}

interface Route {
  from: string;
  to: string;
  waypoints?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, messages = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Map search query:", query);

    const systemPrompt = `You are Lepen AI Maps Assistant. You help users find locations and directions.

When a user asks about a place or directions:
1. Identify all locations mentioned
2. Provide accurate geographic coordinates (latitude, longitude)
3. Give helpful descriptions of each location
4. If directions are requested, identify the route points

You MUST respond with a JSON object in this exact format:
{
  "message": "Your helpful description of the locations/directions",
  "locations": [
    {
      "name": "Location Name",
      "lat": 40.7128,
      "lng": -74.0060,
      "description": "Brief description of this place",
      "type": "city|landmark|restaurant|etc"
    }
  ],
  "route": {
    "from": "Starting Location Name",
    "to": "Destination Name",
    "waypoints": ["Optional intermediate stop 1", "Optional intermediate stop 2"]
  },
  "center": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "zoom": 12
}

Rules:
- Always provide real, accurate coordinates
- The "locations" array should contain all places to mark on the map
- The "route" object is optional, only include if directions are requested
- Set "center" to the best center point for viewing all locations
- Set "zoom" from 1 (world) to 18 (street level) based on the area covered
- If multiple locations are far apart, use a lower zoom level
- Include the message field with a natural language response

Common coordinate references:
- New York City: 40.7128, -74.0060
- London: 51.5074, -0.1278
- Paris: 48.8566, 2.3522
- Tokyo: 35.6762, 139.6503
- Sydney: -33.8688, 151.2093

IMPORTANT: Only respond with valid JSON. No markdown, no code blocks, just the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Map search error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Map search failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Map search response:", content);

    // Try to parse the JSON response
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const mapData = JSON.parse(cleanContent);
      return new Response(JSON.stringify(mapData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse map response:", parseError);
      // Return a fallback response
      return new Response(JSON.stringify({
        message: content,
        locations: [],
        center: { lat: 0, lng: 0 },
        zoom: 2
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Map search error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
