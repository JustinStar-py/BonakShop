/**
 * Tests for Cloudinary upload utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToCloudinary, CloudinaryUploadResult } from '@/lib/cloudinary';

describe('uploadToCloudinary', () => {
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
    });

    it('should upload file successfully and return result with url', async () => {
        const mockResponse = {
            secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/test.jpg',
            public_id: 'test_image',
            format: 'jpg',
            width: 800,
            height: 600,
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await uploadToCloudinary(mockFile);

        expect(result.success).toBe(true);
        expect(result.url).toBe(mockResponse.secure_url);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData),
            })
        );
    });

    it('should return error when env variables are missing', async () => {
        delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        const result = await uploadToCloudinary(mockFile);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return error when upload fails (no secure_url)', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ error: { message: 'Invalid image' } }),
        });

        const result = await uploadToCloudinary(mockFile);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should return error on network failure', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            new Error('Network error')
        );

        const result = await uploadToCloudinary(mockFile);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should include upload_preset in FormData', async () => {
        const mockResponse = {
            secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test.jpg',
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        await uploadToCloudinary(mockFile);

        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const formData = fetchCall[1].body as FormData;

        expect(formData.get('upload_preset')).toBe('test-preset');
        expect(formData.get('file')).toBe(mockFile);
    });
});
