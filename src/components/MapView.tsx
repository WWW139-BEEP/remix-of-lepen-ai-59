import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainer.current).setView([center.lat, center.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

    // Add new markers
    const bounds = L.latLngBounds([]);
    
    locations.forEach((location, index) => {
      const marker = L.marker([location.lat, location.lng])
        .addTo(mapRef.current!);
      
      // Create popup content
      let popupContent = `<strong>${location.name}</strong>`;
      if (location.description) {
        popupContent += `<br><span style="color: #666;">${location.description}</span>`;
      }
      if (location.type) {
        popupContent += `<br><em style="color: #888; font-size: 11px;">${location.type}</em>`;
      }
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
      bounds.extend([location.lat, location.lng]);
    });

    // Draw route if provided
    if (route && locations.length >= 2) {
      const routeCoords: L.LatLngExpression[] = locations.map(loc => [loc.lat, loc.lng]);
      polylineRef.current = L.polyline(routeCoords, {
        color: "#6366f1",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10"
      }).addTo(mapRef.current);
    }

    // Fit bounds to show all markers
    if (locations.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [locations, center, zoom, route]);

  return (
    <div className={cn("rounded-xl overflow-hidden border border-primary/20", className)}>
      {message && (
        <div className="bg-card/80 backdrop-blur-sm p-3 text-sm text-foreground border-b border-primary/20">
          {message}
        </div>
      )}
      <div ref={mapContainer} className="h-[400px] w-full" />
      {locations.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm p-3 border-t border-primary/20">
          <div className="text-xs text-muted-foreground mb-2">Locations found:</div>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc, i) => (
              <span 
                key={i} 
                className="px-2 py-1 bg-primary/20 rounded-full text-xs text-foreground"
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
