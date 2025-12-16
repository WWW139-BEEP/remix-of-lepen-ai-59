"""
Optional Flask Backend for Lepen AI
Deploy this separately to keep the server alive during idle periods.

Uses Google Gemini API directly:
- Gemini 3 Pro Preview for chat/build modes
- Gemini 2.5 Flash Image (Nano Banana) for image generation

Requirements:
- pip install flask flask-cors requests google-generativeai

Usage:
- Set environment variable: GOOGLE_API_KEY
- Run: python optional.py
- Deploy to your preferred hosting (Render, Railway, Heroku, etc.)
"""

import os
import json
import requests
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to keep server alive"""
    return jsonify({'status': 'ok', 'service': 'lepen-ai-backend'})

@app.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for keep-alive services"""
    return 'pong'

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Chat endpoint using Gemini 3 Pro Preview"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        messages = data.get('messages', [])
        mode = data.get('mode', 'chat')
        
        # Convert messages to Gemini format
        gemini_contents = []
        system_prompt = """You are Lepen AI, an intelligent assistant. You can help with:
- General conversations and questions
- Web searches (use your knowledge to answer)
- Location and map information
- Weather information
- Code generation and debugging

Be helpful, concise, and friendly. When providing code, use markdown code blocks."""

        if mode == 'code':
            system_prompt += "\n\nYou are now in Build mode. Focus on helping with code, programming, and app development."

        for msg in messages:
            role = "user" if msg['role'] == 'user' else "model"
            gemini_contents.append({
                "role": role,
                "parts": [{"text": msg['content']}]
            })

        # Make request to Gemini 3 Pro Preview
        url = f"{GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key={GOOGLE_API_KEY}"
        
        payload = {
            "contents": gemini_contents,
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192
            }
        }

        response = requests.post(url, json=payload, stream=True)
        
        if not response.ok:
            error_text = response.text
            print(f"Gemini API error: {response.status_code} - {error_text}")
            return jsonify({'error': 'AI API error'}), 500

        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
            return jsonify({'content': content, 'message': content})
        else:
            return jsonify({'error': 'No response from AI'}), 500

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-image', methods=['POST', 'OPTIONS'])
def generate_image():
    """Image generation using Gemini 2.5 Flash Image (Nano Banana)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Use Gemini 2.5 Flash Image Preview (Nano Banana)
        url = f"{GEMINI_API_URL}/gemini-2.5-flash-preview-image-generation:generateContent?key={GOOGLE_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": f"Generate an image: {prompt}"}]
            }],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"]
            }
        }

        response = requests.post(url, json=payload)
        
        if not response.ok:
            error_text = response.text
            print(f"Image generation error: {response.status_code} - {error_text}")
            return jsonify({'error': 'Image generation failed'}), 500

        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            parts = result['candidates'][0]['content']['parts']
            image_url = None
            text_content = "Here's your generated image!"
            
            for part in parts:
                if 'inlineData' in part:
                    mime_type = part['inlineData']['mimeType']
                    b64_data = part['inlineData']['data']
                    image_url = f"data:{mime_type};base64,{b64_data}"
                elif 'text' in part:
                    text_content = part['text']
            
            return jsonify({
                'imageUrl': image_url,
                'text': text_content
            })
        else:
            return jsonify({'error': 'No image generated'}), 500

    except Exception as e:
        print(f"Image generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/web-search', methods=['POST', 'OPTIONS'])
def web_search():
    """Web search using Gemini's grounding capability"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        query = data.get('query', '')
        
        url = f"{GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key={GOOGLE_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": f"Search and provide information about: {query}"}]
            }],
            "tools": [{
                "googleSearch": {}
            }],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 4096
            }
        }

        response = requests.post(url, json=payload)
        
        if not response.ok:
            return jsonify({'error': 'Search failed'}), 500

        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
            return jsonify({'content': content, 'results': content})
        
        return jsonify({'error': 'No search results'}), 500

    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/map-search', methods=['POST', 'OPTIONS'])
def map_search():
    """Map/location search using Gemini"""
    if request.method == 'OPTIONS':
        return '', 204
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        query = data.get('query', '')
        
        url = f"{GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key={GOOGLE_API_KEY}"
        
        system_prompt = """You are a location assistant. When given a location query:
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
Only return valid JSON."""

        payload = {
            "contents": [{
                "parts": [{"text": f"Find location information for: {query}"}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }

        response = requests.post(url, json=payload)
        
        if not response.ok:
            return jsonify({'error': 'Location search failed'}), 500

        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            content = result['candidates'][0]['content']['parts'][0]['text']
            # Try to parse as JSON
            try:
                # Clean up markdown code blocks if present
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0]
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0]
                
                map_data = json.loads(content.strip())
                return jsonify({'mapData': map_data, 'content': map_data.get('message', '')})
            except:
                return jsonify({'content': content})
        
        return jsonify({'error': 'No location results'}), 500

    except Exception as e:
        print(f"Map search error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Lepen AI Backend starting on port {port}")
    print("Models: Gemini 3 Pro Preview (chat/build), Gemini 2.5 Flash Image (images)")
    app.run(host='0.0.0.0', port=port, debug=False)
