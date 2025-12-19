/**
 * API Configuration for Lepen AI
 * 
 * This file manages the backend connection URL.
 * The URL is stored in localStorage and configured programmatically.
 */

// Get backend URL from localStorage (hidden from UI)
function getStoredBackendUrl(): string {
  try {
    return localStorage.getItem('lepen_backend_url') || '';
  } catch {
    return '';
  }
}

// Configuration
const config = {
  backendUrl: getStoredBackendUrl(),
  fallbackTimeout: 30000,
};

// Load backend config on initialization
export function loadBackendConfig(): void {
  try {
    const stored = localStorage.getItem('lepen_backend_url');
    if (stored) {
      config.backendUrl = stored;
    }
  } catch (e) {
    console.warn('Could not load backend config:', e);
  }
}

// Save backend URL (called programmatically, not from UI)
export function saveBackendUrl(url: string): void {
  config.backendUrl = url.trim();
  try {
    localStorage.setItem('lepen_backend_url', config.backendUrl);
  } catch (e) {
    console.warn('Could not save backend URL:', e);
  }
}

// Get current backend URL
export function getBackendUrl(): string {
  return config.backendUrl;
}

// Check if backend is configured
export function isBackendConfigured(): boolean {
  return config.backendUrl.length > 0;
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
  const baseUrl = config.backendUrl;
  
  if (!baseUrl) {
    throw new Error('Backend not configured. Please contact the administrator.');
  }
  
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
    return response;
    
  } catch (error) {
    console.error(`Backend request failed:`, error);
    throw error;
  }
}

// Initialize on load
loadBackendConfig();

export default config;
