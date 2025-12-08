// FILE: app/api/admin/routes/route.ts
// DESCRIPTION: Delivery route optimization API

import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getOptimizedRoutesForDate, getWorkerRoute } from '@/lib/delivery';

export async function GET(request: Request) {
    const auth = await getAuthUserFromRequest(request);
    if (!auth || (auth.user.role !== 'ADMIN' && auth.user.role !== 'WORKER')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const workerId = searchParams.get('workerId');

        if (!dateStr) {
            return NextResponse.json(
                { error: 'Date parameter required' },
                { status: 400 }
            );
        }

        const date = new Date(dateStr);

        if (workerId) {
            // Get route for specific worker
            const route = await getWorkerRoute(workerId, date);
            return NextResponse.json(route);
        }

        // Get all optimized routes for the date
        const routes = await getOptimizedRoutesForDate(date);
        return NextResponse.json(routes);
    } catch (error) {
        console.error('Routes error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
