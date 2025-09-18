// FILE: components/shared/MapPicker.tsx (FINAL UX IMPROVEMENTS)
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngTuple, Map } from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react'; // Loader2 is now imported
import { Button } from '@/components/ui/button';

// Import Leaflet CSS directly here to make the component self-contained
import "leaflet/dist/leaflet.css";
import "leaflet/dist/images/marker-shadow.png";

// Define the default marker icon
const DefaultIcon = new Icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Define the props for our MapPicker component
interface MapPickerProps {
    onLocationChange?: (lat: number, lng: number) => void;
    initialPosition?: LatLngTuple;
    marker?: { position: LatLngTuple; popupText: string };
    readOnly?: boolean;
    height?: string;
}

// An internal component to handle map click events cleanly
function MapEventsController({ setPosition, onLocationChange }: {
    setPosition: React.Dispatch<React.SetStateAction<LatLngTuple | null>>;
    onLocationChange?: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onLocationChange?.(lat, lng);
        },
    });
    return null;
}

export default function MapPicker({ 
    onLocationChange, 
    initialPosition,
    marker,
    readOnly = false,
    height = 'h-60' // --- FIX 1: Default height is now smaller (h-64 -> h-60) ---
}: MapPickerProps) {
    const [markerPosition, setMarkerPosition] = useState<LatLngTuple | null>(initialPosition || null);
    const mapRef = useRef<Map | null>(null);
    // --- FIX 2: Added loading state for geolocation button ---
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (!readOnly && initialPosition) {
            setMarkerPosition(initialPosition);
            if (mapRef.current) {
                mapRef.current.flyTo(initialPosition, 15);
            }
        }
    }, [initialPosition, readOnly]);

    // --- FIX 2: Updated handler with loading state ---
    const handleFindMe = () => {
        if (mapRef.current) {
            setIsLocating(true); // Start loading
            const map = mapRef.current;
            map.locate().on("locationfound", function (e) {
                const newPos: LatLngTuple = [e.latlng.lat, e.latlng.lng];
                setMarkerPosition(newPos);
                onLocationChange?.(newPos[0], newPos[1]);
                map.flyTo(newPos, 15);
                setIsLocating(false); // Stop loading on success
            }).on("locationerror", function(){
                alert("امکان دسترسی به موقعیت مکانی شما وجود ندارد.");
                setIsLocating(false); // Stop loading on error
            });
        }
    };
    
    const mapCenter = readOnly && marker ? marker.position : (initialPosition || [35.7219, 51.3347]);

    return (
        <div className="flex flex-col gap-2">
            {!readOnly && (
                // --- FIX 2: Button JSX is now conditional based on loading state ---
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleFindMe}
                    className="w-full"
                    disabled={isLocating}
                >
                    {isLocating ? (
                        <>
                            در حال یافتن موقعیت...
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                    ) : (
                        <>
                            <LocateFixed className="ml-2 h-4 w-4" />
                            پیدا کردن موقعیت مکانی من
                        </>
                    )}
                </Button>
            )}
            <div className={`${height} w-full rounded-md overflow-hidden relative border z-0`}>
                 <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {readOnly && marker ? (
                         <Marker position={marker.position} icon={DefaultIcon}>
                             <Popup>{marker.popupText}</Popup>
                         </Marker>
                    ) : (
                        <>
                            <MapEventsController 
                                setPosition={setMarkerPosition} 
                                onLocationChange={onLocationChange} 
                            />
                            {markerPosition && (
                                <Marker 
                                    position={markerPosition} 
                                    icon={DefaultIcon} 
                                    draggable={true}
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const markerInstance = e.target;
                                            const newPos = markerInstance.getLatLng();
                                            setMarkerPosition([newPos.lat, newPos.lng]);
                                            onLocationChange?.(newPos.lat, newPos.lng);
                                        }
                                    }}
                                />
                            )}
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}

