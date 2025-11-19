"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngTuple, Map } from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { LocateFixed, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Leaflet CSS directly here to make the component self-contained
import "leaflet/dist/leaflet.css";
// Note: Ensure marker images are in your public folder if not handled by webpack
import "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = new Icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface MapPickerProps {
    onLocationChange?: (lat: number, lng: number) => void;
    initialPosition?: LatLngTuple;
    marker?: { position: LatLngTuple; popupText: string };
    readOnly?: boolean;
    height?: string;
}

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
    height = 'h-60'
}: MapPickerProps) {
    const [markerPosition, setMarkerPosition] = useState<LatLngTuple | null>(initialPosition || null);
    const mapRef = useRef<Map | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (!readOnly && initialPosition) {
            setMarkerPosition(initialPosition);
            if (mapRef.current) {
                mapRef.current.flyTo(initialPosition, 15);
            }
        }
    }, [initialPosition, readOnly]);

    const handleFindMe = () => {
        if (mapRef.current) {
            setIsLocating(true);
            const map = mapRef.current;
            map.locate().on("locationfound", function (e) {
                const newPos: LatLngTuple = [e.latlng.lat, e.latlng.lng];
                setMarkerPosition(newPos);
                onLocationChange?.(newPos[0], newPos[1]);
                map.flyTo(newPos, 15);
                setIsLocating(false);
            }).on("locationerror", function(){
                alert("امکان دسترسی به موقعیت مکانی شما وجود ندارد. لطفاً GPS را روشن کنید.");
                setIsLocating(false);
            });
        }
    };
    
    // Default center: Tehran
    const mapCenter = readOnly && marker ? marker.position : (initialPosition || [35.7219, 51.3347]);

    return (
        <div className="flex flex-col gap-3">
            {!readOnly && (
                <div className="flex items-center justify-between gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleFindMe}
                        className="w-full bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100 hover:text-teal-800 h-10 rounded-xl transition-all"
                        disabled={isLocating}
                    >
                        {isLocating ? (
                            <>
                                در حال یافتن...
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            </>
                        ) : (
                            <>
                                <LocateFixed className="ml-2 h-4 w-4" />
                                موقعیت کنونی من
                            </>
                        )}
                    </Button>
                </div>
            )}

            <div className={`${height} w-full rounded-xl overflow-hidden relative border border-gray-200 shadow-inner z-0`}>
                 <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

                {/* Overlay Tip if no marker selected yet (only in edit mode) */}
                {!readOnly && !markerPosition && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs text-gray-600 pointer-events-none z-[1000] flex items-center gap-1 w-max">
                        <MapPin size={12} className="text-red-500"/>
                        روی نقشه ضربه بزنید
                    </div>
                )}
            </div>
        </div>
    );
}