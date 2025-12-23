// lib/cloudinary.ts
// Cloudinary upload utility for client-side image uploads

export interface CloudinaryUploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Upload an image to Cloudinary using unsigned upload preset
 * @param file - The file to upload
 * @returns Promise with upload result containing URL or error
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        console.error('Cloudinary config missing. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env');
        return { success: false, error: 'پیکربندی Cloudinary یافت نشد' };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
        );

        const data = await response.json();

        if (data.secure_url) {
            return { success: true, url: data.secure_url };
        } else {
            return { success: false, error: data.error?.message || 'آپلود عکس موفق نبود' };
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return { success: false, error: 'خطا در آپلود عکس' };
    }
}
