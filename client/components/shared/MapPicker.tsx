// FILE: components/shared/MapPicker.tsx
// FINAL VERSION: Added missing 'useMapEvents' import.
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'; // <-- FIX: useMapEvents added here
import { LatLngExpression, Icon, LatLngTuple } from 'leaflet';
import { useEffect, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

import "leaflet/dist/images/marker-shadow.png";
// You need to copy 'marker-icon.png' to your /public folder for this to work.
const DefaultIcon = new Icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface MapPickerProps {
    onLocationChange?: (lat: number, lng: number) => void;
    initialPosition?: LatLngTuple;
    markers?: { position: LatLngTuple; popupText: string }[];
    readOnly?: boolean;
    height?: string;
}

function DraggableMarker({ onLocationChange, initialPosition }: Pick<MapPickerProps, 'onLocationChange' | 'initialPosition'>) {
    const [position, setPosition] = useState<LatLngExpression | null>(initialPosition || null);
    
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationChange?.(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={DefaultIcon} draggable={true} eventHandlers={{
            dragend: (e) => {
                const marker = e.target;
                const newPos = marker.getLatLng();
                setPosition(newPos);
                onLocationChange?.(newPos.lat, newPos.lng);
            }
        }}>
        </Marker>
    );
}

function GoToCurrentLocationButton() {
    const map = useMap();
    const handleClick = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 15),
            () => alert("امکان دسترسی به موقعیت مکانی شما وجود ندارد.")
        );
    };
    return (
        <Button onClick={handleClick} size="icon" className="absolute top-2 right-2 z-[1000] h-8 w-8" type="button">
            <LocateFixed className="h-4 w-4" />
        </Button>
    )
}

export default function MapPicker({ 
    onLocationChange, 
    initialPosition = [35.6892, 51.3890], // Default to Tehran
    markers,
    readOnly = false,
    height = 'h-64'
}: MapPickerProps) {
    const map = (
        <MapContainer center={initialPosition} zoom={readOnly ? 10 : 13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {readOnly ? (
                markers?.map((marker, idx) => (
                    <Marker key={idx} position={marker.position} icon={DefaultIcon}>
                        <Popup>{marker.popupText}</Popup>
                    </Marker>
                ))
            ) : (
                <>
                    <DraggableMarker onLocationChange={onLocationChange} initialPosition={initialPosition} />
                    <GoToCurrentLocationButton />
                </>
            )}
        </MapContainer>
    );

    return (
        <div className={`${height} w-full rounded-md overflow-hidden relative border`}>
             {map}
        </div>
    );
}