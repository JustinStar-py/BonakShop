/**
 * Tests for delivery utility functions
 * Note: calculateDistance is a private function, so we test it indirectly via getDeliveryZone
 */

import { describe, it, expect } from 'vitest';
import {
    getDeliveryZone,
    estimateDeliveryDate,
    DELIVERY_ZONES,
    optimizeRoute,
} from '@/lib/delivery';

describe('DELIVERY_ZONES', () => {
    it('should have 4 delivery zones defined', () => {
        expect(DELIVERY_ZONES).toHaveLength(4);
    });

    it('should have zones covering all distances', () => {
        expect(DELIVERY_ZONES[0].minDistance).toBe(0);
        expect(DELIVERY_ZONES[3].maxDistance).toBe(Infinity);
    });

    it('should have zones in sequential order', () => {
        for (let i = 1; i < DELIVERY_ZONES.length; i++) {
            expect(DELIVERY_ZONES[i].minDistance).toBe(DELIVERY_ZONES[i - 1].maxDistance);
        }
    });

    it('should have increasing delivery fees', () => {
        for (let i = 1; i < DELIVERY_ZONES.length; i++) {
            expect(DELIVERY_ZONES[i].deliveryFee).toBeGreaterThanOrEqual(
                DELIVERY_ZONES[i - 1].deliveryFee
            );
        }
    });

    it('should have increasing estimated days', () => {
        for (let i = 1; i < DELIVERY_ZONES.length; i++) {
            expect(DELIVERY_ZONES[i].estimatedDays).toBeGreaterThanOrEqual(
                DELIVERY_ZONES[i - 1].estimatedDays
            );
        }
    });
});

describe('getDeliveryZone', () => {
    it('should return zone 1 for coordinates at warehouse (0 distance)', () => {
        // Warehouse coordinates (Tehran center) - exactly same location
        const zone = getDeliveryZone(35.6892, 51.3890);
        expect(zone.name).toContain('نزدیک');
        expect(zone.deliveryFee).toBe(0);
        expect(zone.estimatedDays).toBe(1);
    });

    it('should return zone 4 for very far coordinates', () => {
        // Isfahan coordinates - ~340km away
        const zone = getDeliveryZone(32.6546, 51.6680);
        expect(zone.name).toContain('خارج شهر');
        expect(zone.estimatedDays).toBe(3);
    });

    it('should return zone with correct structure', () => {
        const zone = getDeliveryZone(35.6892, 51.3890);
        expect(zone).toHaveProperty('name');
        expect(zone).toHaveProperty('minDistance');
        expect(zone).toHaveProperty('maxDistance');
        expect(zone).toHaveProperty('deliveryFee');
        expect(zone).toHaveProperty('estimatedDays');
    });

    it('should charge no delivery for zone 1', () => {
        const zone = getDeliveryZone(35.6892, 51.3890);
        expect(zone.deliveryFee).toBe(0);
    });
});

describe('estimateDeliveryDate', () => {
    it('should return a future date', () => {
        const now = new Date();
        const deliveryDate = estimateDeliveryDate(35.6892, 51.3890);
        expect(deliveryDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return earlier date for closer locations', () => {
        // Near warehouse
        const nearDate = estimateDeliveryDate(35.6892, 51.3890);
        // Far location (Isfahan)
        const farDate = estimateDeliveryDate(32.6546, 51.6680);

        expect(nearDate.getTime()).toBeLessThan(farDate.getTime());
    });

    it('should return Date object', () => {
        const deliveryDate = estimateDeliveryDate(35.6892, 51.3890);
        expect(deliveryDate).toBeInstanceOf(Date);
    });
});

describe('optimizeRoute', () => {
    it('should return empty route for no locations', () => {
        const result = optimizeRoute([]);
        expect(result.totalDistance).toBe(0);
        expect(result.totalDuration).toBe(0);
        expect(result.stops).toHaveLength(0);
    });

    it('should return route with all locations', () => {
        const locations = [
            { orderId: 'order1', latitude: 35.70, longitude: 51.40, deliveryDate: new Date() },
            { orderId: 'order2', latitude: 35.72, longitude: 51.42, deliveryDate: new Date() },
        ];

        const result = optimizeRoute(locations);
        expect(result.stops).toHaveLength(2);
        expect(result.totalDistance).toBeGreaterThan(0);
        expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should number stops sequentially', () => {
        const locations = [
            { orderId: 'order1', latitude: 35.70, longitude: 51.40, deliveryDate: new Date() },
            { orderId: 'order2', latitude: 35.72, longitude: 51.42, deliveryDate: new Date() },
            { orderId: 'order3', latitude: 35.74, longitude: 51.44, deliveryDate: new Date() },
        ];

        const result = optimizeRoute(locations);
        expect(result.stops[0].order).toBe(1);
        expect(result.stops[1].order).toBe(2);
        expect(result.stops[2].order).toBe(3);
    });

    it('should include estimated arrival times', () => {
        const locations = [
            { orderId: 'order1', latitude: 35.70, longitude: 51.40, deliveryDate: new Date() },
        ];

        const result = optimizeRoute(locations);
        expect(result.stops[0].estimatedArrival).toBeInstanceOf(Date);
    });

    it('should include distance from previous stop', () => {
        const locations = [
            { orderId: 'order1', latitude: 35.70, longitude: 51.40, deliveryDate: new Date() },
        ];

        const result = optimizeRoute(locations);
        expect(result.stops[0].distanceFromPrevious).toBeGreaterThanOrEqual(0);
    });
});
