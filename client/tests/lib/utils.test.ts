/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classnames utility)', () => {
    it('should merge single class', () => {
        expect(cn('foo')).toBe('foo');
    });

    it('should merge multiple classes', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
        const isActive = true;
        expect(cn('base', isActive && 'active')).toBe('base active');
    });

    it('should filter out falsy values', () => {
        expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz');
    });

    it('should handle object syntax', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle array syntax', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should merge tailwind classes correctly', () => {
        // twMerge should deduplicate conflicting classes
        expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle complex tailwind merging', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should preserve non-conflicting classes', () => {
        expect(cn('px-2', 'py-4', 'text-lg')).toBe('px-2 py-4 text-lg');
    });
});
