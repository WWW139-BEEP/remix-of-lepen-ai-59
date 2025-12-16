/**
 * Optional Node.js Backend for Lepen AI
 * Deploy this separately to keep the server alive during idle periods.
 * 
 * Uses Google Gemini API directly:
 * - Gemini 3 Pro Preview for chat/build modes
 * - Gemini 2.5 Flash Image (Nano Banana) for image generation
 * 
 * Requirements:
 * - npm install express cors
 * 
 * Usage:
 * - Set environment variable: GOOGLE_API_KEY
 * - Run: node optional.js
 * - Deploy to your preferred hosting (Render, Railway, Heroku, Vercel, etc.)
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lepen-ai-backend' });
});

// Ping endpoint for keep-alive
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Chat endpoint - Gemini 3 Pro Preview
app.post('/api/chat', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });
  }

  try {
    const { messages, mode } = req.body;

    // System prompt
    let systemPrompt = `You are Lepen AI, an intelligent assistant. You can help with:
- General conversations and questions
- Web searches (use your knowledge to answer)
- Location and map information
- Weather information
- Code generation and debugging

Be helpful, concise, and friendly. When providing code, use markdown code blocks.`;

    if (mode === 'code') {
      systemPrompt += '\n\nYou are now in Build mode. Focus on helping with code, programming, and app development.';
    }

    // Convert messages to Gemini format
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
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
      return res.status(500).json({ error: 'AI API error' });
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const content = result.candidates[0].content.parts[0].text;
      return res.json({ content, message: content });
    }

    res.status(500).json({ error: 'No response from AI' });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image generation - Gemini 2.5 Flash Image (Nano Banana)
app.post('/api/generate-image', async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.5-flash-preview-image-generation:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate an image: ${prompt}` }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation error:', response.status, errorText);
      return res.status(500).json({ error: 'Image generation failed' });
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const parts = result.candidates[0].content.parts;
      let imageUrl = null;
      let textContent = "Here's your generated image!";

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
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });
  }

  try {
    const { query } = req.body;

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Search and provide information about: ${query}` }]
          }],
          tools: [{
            googleSearch: {}
          }],
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
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });
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
      `${GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Find location information for: ${query}` }]
          }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
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

      // Try to parse as JSON
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
  console.log(`Lepen AI Backend running on port ${PORT}`);
  console.log('Models: Gemini 3 Pro Preview (chat/build), Gemini 2.5 Flash Image (images)');
  console.log(`Health check: http://localhost:${PORT}/health`);
});
