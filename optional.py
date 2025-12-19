"""
Optional Flask Backend for Lepen AI
Deploy to Render or similar platform.

Features:
- Gemini 2.0 Flash for chat/build modes (faster)
- Gemini 2.0 Flash Image for image generation & editing
- Image editing from uploaded images
- Cold start handling with keep-alive
- Streaming support for faster responses

Environment:
- GOOGLE_API_KEY: Your Google AI API key
- PORT: Server port (default 5000)

pip install flask flask-cors requests
python optional.py
"""

import os
import json
import time
import requests
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import base64
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Cold start tracking
last_request_time = time.time()

def warm_up():
    global last_request_time
    last_request_time = time.time()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    warm_up()
    uptime = int(time.time() - last_request_time)
    return jsonify({
        'status': 'ok',
        'service': 'lepen-ai-backend',
        'uptime_seconds': uptime,
        'ready': True
    })

@app.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for keep-alive"""
    warm_up()
    return 'pong'

@app.route('/api/keepalive', methods=['GET'])
def keepalive():
    """Keep-alive endpoint for Render"""
    warm_up()
    return jsonify({'alive': True, 'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')})

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Streaming Chat endpoint using Gemini 2.0 Flash"""
    if request.method == 'OPTIONS':
        return '', 204
    
    warm_up()
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        messages = data.get('messages', [])
        mode = data.get('mode', 'chat')
        image_data = data.get('imageData')
        
        # System prompt
        system_prompt = """You are Lepen AI, an intelligent assistant. You can help with:
- General conversations and questions
- Web searches (use your knowledge to answer)
- Location and map information
- Weather information
- Code generation and debugging
- Mathematical calculations (format equations properly using LaTeX)

Be helpful, concise, and friendly. When providing code, use markdown code blocks.
For math equations, use LaTeX format: $inline$ or $$block$$
Use **bold**, *italic*, and __underline__ for emphasis."""

        if mode == 'code':
            system_prompt += "\n\nYou are now in Build mode. Focus on helping with code, programming, and app development. Provide well-structured, clean code with comments."

        # Build content parts
        gemini_contents = []
        
        for i, msg in enumerate(messages):
            role = "user" if msg['role'] == 'user' else "model"
            parts = []
            
            # Check if message has image data
            msg_image = msg.get('imageData') or (image_data if i == len(messages) - 1 else None)
            if msg_image and msg_image.startswith('data:'):
                match = re.match(r'^data:([^;]+);base64,(.+)$', msg_image)
                if match:
                    parts.append({
                        "inlineData": {
                            "mimeType": match.group(1),
                            "data": match.group(2)
                        }
                    })
            
            parts.append({"text": msg['content']})
            gemini_contents.append({"role": role, "parts": parts})

        # Streaming response
        def generate():
            url = f"{GEMINI_API_URL}/gemini-2.0-flash:streamGenerateContent?key={GOOGLE_API_KEY}&alt=sse"
            
            payload = {
                "contents": gemini_contents,
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 8192
                }
            }
            
            try:
                response = requests.post(url, json=payload, stream=True)
                
                if not response.ok:
                    yield f'data: {json.dumps({"error": "AI API error"})}\n\n'
                    return
                
                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            try:
                                data = json.loads(line_str[6:])
                                if data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text'):
                                    content = data['candidates'][0]['content']['parts'][0]['text']
                                    yield f'data: {json.dumps({"choices": [{"delta": {"content": content}}]})}\n\n'
                            except:
                                pass
                
                yield 'data: [DONE]\n\n'
                
            except Exception as e:
                yield f'data: {json.dumps({"error": str(e)})}\n\n'

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        )

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-image', methods=['POST', 'OPTIONS'])
def generate_image():
    """Image generation & editing using Gemini 2.0 Flash Image"""
    if request.method == 'OPTIONS':
        return '', 204
    
    warm_up()
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        prompt = data.get('prompt', '')
        image_data = data.get('imageData')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Build content parts
        parts = []
        is_edit = False
        
        if image_data and image_data.startswith('data:'):
            match = re.match(r'^data:([^;]+);base64,(.+)$', image_data)
            if match:
                is_edit = True
                parts.append({
                    "inlineData": {
                        "mimeType": match.group(1),
                        "data": match.group(2)
                    }
                })
                parts.append({"text": f"Edit this image: {prompt}"})
        
        if not is_edit:
            parts.append({"text": f"Generate an image: {prompt}"})

        url = f"{GEMINI_API_URL}/gemini-2.0-flash-exp-image-generation:generateContent?key={GOOGLE_API_KEY}"
        
        payload = {
            "contents": [{"parts": parts}],
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
            text_content = "Here's your edited image!" if is_edit else "Here's your generated image!"
            
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
    
    warm_up()
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        query = data.get('query', '')
        
        url = f"{GEMINI_API_URL}/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": f"Search and provide detailed information about: {query}"}]
            }],
            "tools": [{"googleSearch": {}}],
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
    
    warm_up()
    
    if not GOOGLE_API_KEY:
        return jsonify({'error': 'GOOGLE_API_KEY not configured'}), 500
    
    try:
        data = request.json
        query = data.get('query', '')
        
        url = f"{GEMINI_API_URL}/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"
        
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
            "systemInstruction": {"parts": [{"text": system_prompt}]},
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
            
            try:
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
    print(f"\n🚀 Lepen AI Backend starting on port {port}")
    print("📡 Models: Gemini 2.0 Flash (chat/build), Gemini 2.0 Flash Image (images)")
    print("💡 Deploy to Render with: gunicorn optional:app")
    print("\n✅ Ready to accept connections!\n")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
