/**
 * Optional Node.js Backend for Lepen AI
 * Deploy to Render or similar platform.
 * 
 * Models:
 * - Chat: Gemini Flash 3 Preview (gemini-3.0-flash-preview)
 * - Build: Gemini Pro 3 Preview (gemini-3.0-pro-preview)
 * - Image: Gemini 2.5 Flash Image (gemini-2.0-flash-exp-image-generation)
 * 
 * Environment Variables (set in Render dashboard):
 * - GOOGLE_CHAT_API_KEY: API key for Chat mode
 * - GOOGLE_BUILD_API_KEY: API key for Build mode
 * - GOOGLE_IMAGE_API_KEY: API key for Image mode
 * - PORT: Server port (default 3001)
 * 
 * npm install express cors
 * node optional.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Separate API keys for each mode
const API_KEYS = {
  chat: process.env.GOOGLE_CHAT_API_KEY || '',
  build: process.env.GOOGLE_BUILD_API_KEY || '',
  image: process.env.GOOGLE_IMAGE_API_KEY || ''
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model configuration
const MODELS = {
  chat: 'gemini-3.0-flash-preview',
  build: 'gemini-3.0-pro-preview',
  image: 'gemini-2.0-flash-exp-image-generation'
};

// Cold start handling
let lastRequestTime = Date.now();
const COLD_START_THRESHOLD = 10 * 60 * 1000; // 10 minutes

const warmUp = () => {
  lastRequestTime = Date.now();
};

// Health check endpoint
app.get('/health', (req, res) => {
  warmUp();
  res.json({ 
    status: 'ok', 
    service: 'lepen-ai-backend',
    models: MODELS,
    ready: true 
  });
});

// Ping endpoint for keep-alive
app.get('/ping', (req, res) => {
  warmUp();
  res.send('pong');
});

// Keep-alive self-ping (for Render)
app.get('/api/keepalive', (req, res) => {
  warmUp();
  res.json({ alive: true, timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lepen AI Backend',
    status: 'running',
    endpoints: ['/api/chat', '/api/generate-image', '/api/web-search', '/api/map-search'],
    models: MODELS
  });
});

// Streaming Chat endpoint
app.post('/api/chat', async (req, res) => {
  warmUp();

  try {
    const { messages, mode, imageData } = req.body;
    
    // Select model and API key based on mode
    const isCodeMode = mode === 'code';
    const model = isCodeMode ? MODELS.build : MODELS.chat;
    const apiKey = isCodeMode ? API_KEYS.build : API_KEYS.chat;
    
    if (!apiKey) {
      return res.status(500).json({ error: `API key not configured for ${isCodeMode ? 'Build' : 'Chat'} mode` });
    }

    // System prompt
    let systemPrompt = `You are Lepen AI, an intelligent assistant. You can help with:
- General conversations and questions
- Web searches (use your knowledge to answer)
- Location and map information
- Weather information
- Code generation and debugging
- Mathematical calculations (format equations properly using LaTeX)

Be helpful, concise, and friendly. When providing code, use markdown code blocks.
For math equations, use LaTeX format: $inline$ or $$block$$
Use **bold**, *italic*, and __underline__ for emphasis.`;

    if (mode === 'code') {
      systemPrompt += '\n\nYou are now in Build mode. Focus on helping with code, programming, and app development. Provide well-structured, clean code with comments. Use the powerful Gemini Pro 3 Preview model for advanced reasoning.';
    }

    // Build content parts
    const geminiContents = [];
    
    for (const msg of messages) {
      const role = msg.role === 'user' ? 'user' : 'model';
      const parts = [];
      
      // Check if message has image data
      if (msg.imageData || (msg === messages[messages.length - 1] && imageData)) {
        const imgData = msg.imageData || imageData;
        if (imgData && imgData.startsWith('data:')) {
          const base64Match = imgData.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            parts.push({
              inlineData: {
                mimeType: base64Match[1],
                data: base64Match[2]
              }
            });
          }
        }
      }
      
      parts.push({ text: msg.content });
      geminiContents.push({ role, parts });
    }

    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const response = await fetch(
      `${GEMINI_API_URL}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      res.write(`data: ${JSON.stringify({ error: 'AI API error', details: errorText })}\n\n`);
      return res.end();
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const content = data.candidates[0].content.parts[0].text;
              res.write(`data: ${JSON.stringify({
                choices: [{ delta: { content } }]
              })}\n\n`);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Image generation & editing - Gemini 2.5 Flash Image
app.post('/api/generate-image', async (req, res) => {
  warmUp();
  
  if (!API_KEYS.image) {
    return res.status(500).json({ error: 'Image API key not configured' });
  }

  try {
    const { prompt, imageData } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Build content parts
    const parts = [];
    
    // Add existing image if provided (for editing)
    if (imageData && imageData.startsWith('data:')) {
      const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match) {
        parts.push({
          inlineData: {
            mimeType: base64Match[1],
            data: base64Match[2]
          }
        });
        parts.push({ text: `Edit this image based on this instruction: ${prompt}` });
      } else {
        parts.push({ text: `Generate an image: ${prompt}` });
      }
    } else {
      parts.push({ text: `Generate an image: ${prompt}` });
    }

    const response = await fetch(
      `${GEMINI_API_URL}/${MODELS.image}:generateContent?key=${API_KEYS.image}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation error:', response.status, errorText);
      return res.status(500).json({ error: 'Image generation failed', details: errorText });
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const parts = result.candidates[0].content.parts;
      let imageUrl = null;
      let textContent = imageData ? "Here's your edited image!" : "Here's your generated image!";

      for (const part of parts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType;
          const b64Data = part.inlineData.data;
          imageUrl = `data:${mimeType};base64,${b64Data}`;
        } else if (part.text) {
          textContent = part.text;
        }
      }

      return res.json({ imageUrl, text: textContent });
    }

    res.status(500).json({ error: 'No image generated' });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Web search with Gemini grounding
app.post('/api/web-search', async (req, res) => {
  warmUp();
  
  if (!API_KEYS.chat) {
    return res.status(500).json({ error: 'Chat API key not configured for search' });
  }

  try {
    const { query } = req.body;

    const response = await fetch(
      `${GEMINI_API_URL}/${MODELS.chat}:generateContent?key=${API_KEYS.chat}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Search and provide detailed information about: ${query}` }]
          }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096
          }
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Search failed' });
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const content = result.candidates[0].content.parts[0].text;
      return res.json({ content, results: content });
    }

    res.status(500).json({ error: 'No search results' });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Map/location search
app.post('/api/map-search', async (req, res) => {
  warmUp();
  
  if (!API_KEYS.chat) {
    return res.status(500).json({ error: 'Chat API key not configured for map search' });
  }

  try {
    const { query } = req.body;

    const systemPrompt = `You are a location assistant. When given a location query:
1. Identify the locations mentioned
2. Provide coordinates (latitude/longitude)
3. Return a JSON response with this format:
{
  "locations": [
    {"name": "Place Name", "lat": 0.0, "lng": 0.0, "description": "Brief description"}
  ],
  "center": {"lat": 0.0, "lng": 0.0},
  "zoom": 12,
  "message": "Description of the locations"
}
Only return valid JSON.`;

    const response = await fetch(
      `${GEMINI_API_URL}/${MODELS.chat}:generateContent?key=${API_KEYS.chat}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Find location information for: ${query}` }]
          }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Location search failed' });
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      let content = result.candidates[0].content.parts[0].text;

      try {
        if (content.includes('```json')) {
          content = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
          content = content.split('```')[1].split('```')[0];
        }

        const mapData = JSON.parse(content.trim());
        return res.json({ mapData, content: mapData.message || '' });
      } catch {
        return res.json({ content });
      }
    }

    res.status(500).json({ error: 'No location results' });
  } catch (error) {
    console.error('Map search error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Lepen AI Backend running on port ${PORT}`);
  console.log('📡 Models:');
  console.log(`   - Chat: ${MODELS.chat}`);
  console.log(`   - Build: ${MODELS.build}`);
  console.log(`   - Image: ${MODELS.image}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('💡 Deploy to Render with: npm start');
  console.log('\n✅ Ready to accept connections!\n');
});
