/**
 * API Configuration for Lepen AI
 * 
 * This file manages backend endpoints for the optional.js backend.
 * When deployed together on Render, it auto-detects the backend URL.
 */

// Auto-detect backend URL when deployed on same origin
function getAutoBackendUrl(): string {
  // Check localStorage first
  const stored = localStorage.getItem('lepen_backend_url');
  if (stored) return stored;
  
  // When deployed together on Render, the backend runs on the same origin
  // So we can use the current origin as the backend URL
  const currentOrigin = window.location.origin;
  
  // If running on localhost (development), don't auto-detect
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return '';
  }
  
  // For production deployments (Render, etc.), use same origin
  return currentOrigin;
}

// Default configuration
const config = {
  // Backend URL - auto-detected or from localStorage
  backendUrl: getAutoBackendUrl(),
  
  // Fallback backends (set via localStorage)
  fallbackUrls: [] as string[],
  
  // Timeout before trying fallback (ms)
  fallbackTimeout: 30000,
  
  // Max retries
  maxRetries: 2,
};

// Load backend URL from localStorage
export function loadBackendConfig(): void {
  try {
    const stored = localStorage.getItem('lepen_backend_url');
    if (stored) {
      config.backendUrl = stored;
    }
    
    const fallbacks = localStorage.getItem('lepen_fallback_backends');
    if (fallbacks) {
      const parsed = JSON.parse(fallbacks);
      if (Array.isArray(parsed)) {
        config.fallbackUrls = parsed.filter(url => typeof url === 'string' && url.trim());
      }
    }
  } catch (e) {
    console.warn('Could not load backend config:', e);
  }
}

// Save backend URL to localStorage
export function saveBackendUrl(url: string): void {
  config.backendUrl = url.trim();
  localStorage.setItem('lepen_backend_url', config.backendUrl);
}

// Save fallback URLs to localStorage
export function saveFallbackConfig(urls: string[]): void {
  config.fallbackUrls = urls.filter(url => url.trim());
  localStorage.setItem('lepen_fallback_backends', JSON.stringify(config.fallbackUrls));
}

// Get current backend URL
export function getBackendUrl(): string {
  return config.backendUrl;
}

// Get current fallback URLs
export function getFallbackUrls(): string[] {
  return [config.backendUrl, ...config.fallbackUrls].filter(url => url.trim());
}

// Check if a backend is healthy
export async function checkBackendHealth(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Make API request to the backend
export async function fetchFromBackend(
  endpoint: string,
  options: RequestInit
): Promise<Response> {
  const urls = getFallbackUrls();
  
  if (urls.length === 0) {
    throw new Error('No backend configured. Please set your Render backend URL in Settings.');
  }
  
  let lastError: Error | null = null;
  
  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.fallbackTimeout
      );
      
      const response = await fetch(`${baseUrl}/api/${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        return response;
      }
      
      lastError = new Error(`Backend ${baseUrl} returned ${response.status}`);
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Backend ${baseUrl} failed:`, error);
      continue;
    }
  }
  
  throw lastError || new Error('All backends unavailable');
}

// Initialize on load
loadBackendConfig();

export default config;
