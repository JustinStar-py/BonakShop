"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngTuple, Map } from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { GpsLinear, RestartLinear, MapPointLinear } from '@solar-icons/react-perf';
import { Button } from '@/components/ui/button';

// Import Leaflet CSS directly here to make the component self-contained
import "leaflet/dist/leaflet.css";
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
                mapRef.current.flyTo(initialPosition, 15, { duration: 1.5 });
            }
        }
    }, [initialPosition, readOnly]);

    const handleFindMe = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent map click
        if (mapRef.current) {
            setIsLocating(true);
            const map = mapRef.current;
            map.locate().on("locationfound", function (e) {
                const newPos: LatLngTuple = [e.latlng.lat, e.latlng.lng];
                setMarkerPosition(newPos);
                onLocationChange?.(newPos[0], newPos[1]);
                map.flyTo(newPos, 15, { duration: 1.5 });
                setIsLocating(false);
            }).on("locationerror", function () {
                alert("امکان دسترسی به موقعیت مکانی شما وجود ندارد. لطفاً GPS را روشن کنید.");
                setIsLocating(false);
            });
        }
    };

    // Default center: Tehran
    const mapCenter = readOnly && marker ? marker.position : (initialPosition || [35.7219, 51.3347]);

    return (
        <div className={`${height} w-full rounded-2xl overflow-hidden relative border border-gray-200 shadow-sm z-0`}>
            <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
                zoomControl={false} // We can add custom controls if needed, or keep default top-left
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains="abcd"
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

            {/* Floating "Locate Me" Button */}
            {!readOnly && (
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={handleFindMe}
                    disabled={isLocating}
                    className="absolute bottom-4 right-4 z-[1000] rounded-full w-12 h-12 bg-white shadow-lg hover:bg-gray-50 text-green-600 border border-gray-100 transition-transform active:scale-95"
                >
                    {isLocating ? (
                        <RestartLinear className="h-5 w-5 animate-spin" />
                    ) : (
                        <GpsLinear className="h-6 w-6" />
                    )}
                </Button>
            )}

            {/* Overlay Tip */}
            {!readOnly && !markerPosition && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm text-xs font-bold text-gray-700 pointer-events-none z-[1000] flex items-center gap-2 border border-gray-100">
                    <MapPointLinear size={18} className="text-red-500" />
                    موقعیت خود را روی نقشه انتخاب کنید
                </div>
            )}
        </div>
    );
}