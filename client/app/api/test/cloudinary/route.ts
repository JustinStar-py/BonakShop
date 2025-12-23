// app/api/test/cloudinary/route.ts
// Test endpoint for Cloudinary upload - DELETE AFTER TESTING
import { NextResponse } from 'next/server';

export async function GET() {
    // Check if Cloudinary config exists
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    return NextResponse.json({
        status: 'ok',
        config: {
            cloudName: cloudName ? '✅ Set' : '❌ Missing',
            uploadPreset: uploadPreset ? '✅ Set' : '❌ Missing',
            cloudNameValue: cloudName ? `${cloudName.substring(0, 3)}...` : null,
        },
        message: cloudName && uploadPreset
            ? '✅ Cloudinary is configured correctly!'
            : '❌ Missing Cloudinary configuration. Check .env file.',
        testUploadUrl: '/api/test/cloudinary',
        instructions: 'POST a file to this endpoint to test upload (multipart/form-data with "file" field)',
    });
}

export async function POST(request: Request) {
    try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            return NextResponse.json({
                success: false,
                error: 'Cloudinary config missing. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
            }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'No file provided. Send a file with the "file" field.',
            }, { status: 400 });
        }

        // Upload to Cloudinary
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: uploadData }
        );

        const data = await response.json();

        if (data.secure_url) {
            return NextResponse.json({
                success: true,
                message: '✅ Upload successful!',
                url: data.secure_url,
                publicId: data.public_id,
                format: data.format,
                size: `${(data.bytes / 1024).toFixed(2)} KB`,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.error?.message || 'Upload failed',
                details: data,
            }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
