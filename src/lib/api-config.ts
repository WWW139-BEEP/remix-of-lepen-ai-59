/**
 * API Configuration for Lepen AI
 * 
 * This file manages backend endpoints with automatic fallback support.
 * When the main Supabase backend is unavailable, the app will automatically
 * try fallback backends if configured.
 * 
 * To configure optional backends:
 * 1. Deploy optional.py or optional.js to your hosting (Render, Railway, Heroku, etc.)
 * 2. Set the FALLBACK_API_URL in your environment or localStorage
 */

// Default configuration
const config = {
  // Main backend (Supabase)
  mainApiUrl: import.meta.env.VITE_SUPABASE_URL,
  mainApiKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  
  // Fallback backends (set via localStorage or environment)
  fallbackUrls: [] as string[],
  
  // Timeout before trying fallback (ms)
  fallbackTimeout: 15000,
  
  // Max retries
  maxRetries: 2,
};

// Load fallback URLs from localStorage
export function loadFallbackConfig(): void {
  try {
    const stored = localStorage.getItem('lepen_fallback_backends');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        config.fallbackUrls = parsed.filter(url => typeof url === 'string' && url.trim());
      }
    }
  } catch (e) {
    console.warn('Could not load fallback config:', e);
  }
}

// Save fallback URLs to localStorage
export function saveFallbackConfig(urls: string[]): void {
  config.fallbackUrls = urls.filter(url => url.trim());
  localStorage.setItem('lepen_fallback_backends', JSON.stringify(config.fallbackUrls));
}

// Get current fallback URLs
export function getFallbackUrls(): string[] {
  return config.fallbackUrls;
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

// Make API request with automatic fallback
export async function fetchWithFallback(
  endpoint: string,
  options: RequestInit,
  useMainEndpoint: boolean = true
): Promise<Response> {
  const urls: string[] = [];
  
  // Add main backend
  if (useMainEndpoint && config.mainApiUrl) {
    urls.push(`${config.mainApiUrl}/functions/v1/${endpoint}`);
  }
  
  // Add fallback backends
  for (const fallbackUrl of config.fallbackUrls) {
    urls.push(`${fallbackUrl}/api/${endpoint}`);
  }
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const isMain = i === 0 && useMainEndpoint;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.fallbackTimeout
      );
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      
      // Add auth header for main backend
      if (isMain && config.mainApiKey) {
        headers['Authorization'] = `Bearer ${config.mainApiKey}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Log which backend was used (useful for debugging)
        if (!isMain) {
          console.log(`Using fallback backend: ${url}`);
        }
        return response;
      }
      
      // If rate limited or server error, try next backend
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`Backend ${url} returned ${response.status}`);
        continue;
      }
      
      // For other errors (4xx), return the response
      return response;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Backend ${url} failed:`, error);
      continue;
    }
  }
  
  // All backends failed
  throw lastError || new Error('All backends unavailable');
}

// Initialize on load
loadFallbackConfig();

export default config;
