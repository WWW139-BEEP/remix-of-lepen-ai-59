import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

interface MapViewProps {
  locations: Location[];
  center?: { lat: number; lng: number };
  zoom?: number;
  route?: Route;
  message?: string;
  className?: string;
}

export const MapView = ({ 
  locations, 
  center = { lat: 0, lng: 0 }, 
  zoom = 2, 
  route,
  message,
  className 
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize map with standard OpenStreetMap tiles
    mapRef.current = L.map(mapContainer.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([center.lat, center.lng], zoom);

    // Add standard OpenStreetMap tile layer (no hybrid)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing route
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (locations.length === 0) return;

    // Add new markers
    const bounds = L.latLngBounds([]);
    
    locations.forEach((location) => {
      // Create custom icon with number
      const marker = L.marker([location.lat, location.lng])
        .addTo(mapRef.current!);
      
      // Create popup content
      let popupContent = `<div style="min-width: 150px;">`;
      popupContent += `<strong style="font-size: 14px;">${location.name}</strong>`;
      if (location.description) {
        popupContent += `<br><span style="color: #666; font-size: 12px;">${location.description}</span>`;
      }
      if (location.type) {
        popupContent += `<br><em style="color: #888; font-size: 11px; text-transform: capitalize;">${location.type}</em>`;
      }
      popupContent += `<br><span style="color: #999; font-size: 10px;">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</span>`;
      popupContent += `</div>`;
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
      bounds.extend([location.lat, location.lng]);
    });

    // Draw route if provided and we have multiple locations
    if (route && locations.length >= 2) {
      const routeCoords: L.LatLngExpression[] = locations.map(loc => [loc.lat, loc.lng]);
      polylineRef.current = L.polyline(routeCoords, {
        color: "#6366f1",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10",
        lineCap: "round",
        lineJoin: "round"
      }).addTo(mapRef.current);
      
      // Add arrow markers for direction
      if (locations.length >= 2) {
        const arrowIcon = L.divIcon({
          className: 'route-arrow',
          html: `<div style="color: #6366f1; font-size: 20px; transform: rotate(45deg);">→</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        // Add direction marker at midpoint
        const midIndex = Math.floor(locations.length / 2);
        if (locations[midIndex]) {
          L.marker([locations[midIndex].lat, locations[midIndex].lng], { 
            icon: arrowIcon,
            interactive: false 
          }).addTo(mapRef.current);
        }
      }
    }

    // Fit bounds to show all markers
    if (locations.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 15,
          animate: true 
        });
      }, 100);
    }
  }, [locations, center, zoom, route]);

  return (
    <div className={cn("rounded-xl overflow-hidden border border-primary/20 shadow-lg", className)}>
      {message && (
        <div className="bg-card/90 backdrop-blur-sm p-4 text-sm text-foreground border-b border-primary/20">
          {message}
        </div>
      )}
      <div ref={mapContainer} className="h-[400px] w-full" style={{ background: '#e5e3df' }} />
      {locations.length > 0 && (
        <div className="bg-card/90 backdrop-blur-sm p-4 border-t border-primary/20">
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            {locations.length} location{locations.length > 1 ? 's' : ''} found:
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc, i) => (
              <span 
                key={i} 
                className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded-full text-xs text-foreground cursor-pointer transition-colors"
                onClick={() => {
                  mapRef.current?.setView([loc.lat, loc.lng], 14, { animate: true });
                  markersRef.current[i]?.openPopup();
                }}
              >
                📍 {loc.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
