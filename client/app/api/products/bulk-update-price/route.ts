import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const {
      productIds,
      reductionType,
      reductionValue,
      direction,
      categoryId,
      supplierId,
      distributorId,
      status,
      searchTerm,
    } = await request.json();

    if (!reductionType || reductionValue === undefined || !direction) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (
      typeof reductionValue !== 'number' ||
      (direction !== 'increase' && direction !== 'decrease') ||
      (reductionType !== 'percentage' && reductionType !== 'fixed') ||
      reductionValue < 0
    ) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const where: any = {};

    if (Array.isArray(productIds) && productIds.length > 0) {
      where.id = { in: productIds };
    }

    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;
    if (distributorId) where.distributorId = distributorId;

    if (status === 'available') where.available = true;
    else if (status === 'unavailable') where.available = false;
    else if (status === 'featured') where.isFeatured = true;

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (reductionType === 'percentage') {
      if (direction === 'decrease' && reductionValue >= 100) {
        return NextResponse.json({ message: 'Percentage decrease must be less than 100%' }, { status: 400 });
      }

      const multiplier =
        direction === 'increase'
          ? 1 + reductionValue / 100
          : 1 - reductionValue / 100;

      await prisma.product.updateMany({
        where,
        data: {
          price: {
            multiply: multiplier,
          },
        },
      });
    } else if (reductionType === 'fixed') {
      await prisma.product.updateMany({
        where: {
          ...where,
          ...(direction === 'decrease' ? { price: { gte: reductionValue } } : {}),
        },
        data: {
          price: {
            [direction === 'increase' ? 'increment' : 'decrement']: reductionValue,
          },
        },
      });
    } else {
      return NextResponse.json({ message: 'Invalid reduction type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Prices updated successfully' });
  } catch (error) {
    console.error('Error updating prices:', error);
    return NextResponse.json({ message: 'Error updating prices' }, { status: 500 });
  }
}
