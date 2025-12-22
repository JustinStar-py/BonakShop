// FILE: lib/delivery.ts
// DESCRIPTION: Delivery route optimization using nearest neighbor algorithm

import prisma from '@/lib/prisma';

interface Location {
    orderId: string;
    latitude: number;
    longitude: number;
    shopName?: string;
    deliveryDate: Date;
}

interface OptimizedRoute {
    totalDistance: number;
    totalDuration: number; // estimated minutes
    stops: Array<{
        order: number; // Stop number (1, 2, 3...)
        orderId: string;
        shopName?: string;
        latitude: number;
        longitude: number;
        distanceFromPrevious: number; // km
        estimatedArrival?: Date;
    }>;
}

// Warehouse location (set your actual warehouse coordinates)
const WAREHOUSE_LOCATION = {
    latitude: 35.6892, // Tehran example
    longitude: 51.3890,
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Optimize delivery route using Nearest Neighbor algorithm
 * This is a greedy heuristic that works well for small-medium routes
 */
export function optimizeRoute(locations: Location[]): OptimizedRoute {
    if (locations.length === 0) {
        return {
            totalDistance: 0,
            totalDuration: 0,
            stops: []
        };
    }

    const unvisited = new Set(locations.map(l => l.orderId));
    const route: OptimizedRoute['stops'] = [];
    let currentLocation = WAREHOUSE_LOCATION;
    let totalDistance = 0;

    // Nearest neighbor algorithm
    while (unvisited.size > 0) {
        let nearest: Location | null = null;
        let nearestDistance = Infinity;

        // Find nearest unvisited location
        for (const location of locations) {
            if (!unvisited.has(location.orderId)) continue;

            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                location.latitude,
                location.longitude
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = location;
            }
        }

        if (nearest) {
            route.push({
                order: route.length + 1,
                orderId: nearest.orderId,
                shopName: nearest.shopName,
                latitude: nearest.latitude,
                longitude: nearest.longitude,
                distanceFromPrevious: nearestDistance
            });

            totalDistance += nearestDistance;
            currentLocation = { latitude: nearest.latitude, longitude: nearest.longitude };
            unvisited.delete(nearest.orderId);
        }
    }

    // Return to warehouse
    const returnDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        WAREHOUSE_LOCATION.latitude,
        WAREHOUSE_LOCATION.longitude
    );
    totalDistance += returnDistance;

    // Estimate duration (average 30 km/h in city + 5 min per stop)
    const travelTimeMinutes = (totalDistance / 30) * 60;
    const stopTimeMinutes = route.length * 5;
    const totalDuration = travelTimeMinutes + stopTimeMinutes;

    // Add estimated arrival times
    let cumulativeMinutes = 0;
    const startTime = new Date();

    route.forEach(stop => {
        cumulativeMinutes += (stop.distanceFromPrevious / 30) * 60 + 5; // Travel + stop time
        stop.estimatedArrival = new Date(startTime.getTime() + cumulativeMinutes * 60000);
    });

    return {
        totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
        totalDuration: Math.round(totalDuration),
        stops: route
    };
}

/**
 * Get optimized routes for a specific date
 */
export async function getOptimizedRoutesForDate(date: Date): Promise<OptimizedRoute[]> {
    // Get orders for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
        where: {
            deliveryDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: 'PENDING', // Only pending orders
            user: {
                latitude: { not: null },
                longitude: { not: null }
            }
        },
        include: {
            user: {
                select: {
                    shopName: true,
                    latitude: true,
                    longitude: true
                }
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    if (orders.length === 0) {
        return [];
    }

    // Map to locations
    const locations: Location[] = orders
        .filter(o => o.user.latitude != null && o.user.longitude != null)
        .map(o => ({
            orderId: o.id,
            latitude: o.user.latitude!,
            longitude: o.user.longitude!,
            shopName: o.user.shopName || undefined,
            deliveryDate: o.deliveryDate
        }));

    // For large number of orders, split into multiple routes
    // Each route should have max 15-20 stops
    const MAX_STOPS_PER_ROUTE = 15;
    const routes: OptimizedRoute[] = [];

    for (let i = 0; i < locations.length; i += MAX_STOPS_PER_ROUTE) {
        const batch = locations.slice(i, i + MAX_STOPS_PER_ROUTE);
        const route = optimizeRoute(batch);
        routes.push(route);
    }

    return routes;
}

/**
 * Get route for specific worker
 */
export async function getWorkerRoute(workerId: string, date: Date): Promise<OptimizedRoute | null> {
    // In a real implementation, you'd assign orders to workers
    // For now, just return the first route
    const routes = await getOptimizedRoutesForDate(date);
    return routes[0] || null;
}

/**
 * Calculate delivery zones based on distance from warehouse
 */
export interface DeliveryZone {
    name: string;
    minDistance: number;
    maxDistance: number;
    deliveryFee: number;
    estimatedDays: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
    {
        name: 'منطقه 1 - نزدیک',
        minDistance: 0,
        maxDistance: 10,
        deliveryFee: 0,
        estimatedDays: 1
    },
    {
        name: 'منطقه 2 - متوسط',
        minDistance: 10,
        maxDistance: 25,
        deliveryFee: 50000,
        estimatedDays: 1
    },
    {
        name: 'منطقه 3 - دور',
        minDistance: 25,
        maxDistance: 50,
        deliveryFee: 100000,
        estimatedDays: 2
    },
    {
        name: 'منطقه 4 - خارج شهر',
        minDistance: 50,
        maxDistance: Infinity,
        deliveryFee: 200000,
        estimatedDays: 3
    }
];

/**
 * Get delivery zone for a location
 */
export function getDeliveryZone(latitude: number, longitude: number): DeliveryZone {
    const distance = calculateDistance(
        WAREHOUSE_LOCATION.latitude,
        WAREHOUSE_LOCATION.longitude,
        latitude,
        longitude
    );

    for (const zone of DELIVERY_ZONES) {
        if (distance >= zone.minDistance && distance < zone.maxDistance) {
            return zone;
        }
    }

    return DELIVERY_ZONES[DELIVERY_ZONES.length - 1]; // Fallback to last zone
}

/**
 * Estimate delivery date based on location
 */
export function estimateDeliveryDate(latitude: number, longitude: number): Date {
    const zone = getDeliveryZone(latitude, longitude);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + zone.estimatedDays);
    return deliveryDate;
}
