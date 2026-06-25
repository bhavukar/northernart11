import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const uploadedFiles: string[] = []; // Track to delete if DB insert fails
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceInInr = formData.get('price') as string;
    const dimensions = formData.get('dimensions') as string;
    const medium = formData.get('medium') as string;
    
    const coverImageFile = formData.get('image') as File | null;
    const secondaryImageFiles = formData.getAll('additional_images') as File[];

    if (!title || !priceInInr || !coverImageFile) {
      return NextResponse.json(
        { error: 'Title, Price, and Cover Image are required' },
        { status: 400 }
      );
    }

    const price = Math.round(parseFloat(priceInInr) * 100);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a valid positive number' },
        { status: 400 }
      );
    }

    const adminSupabase = getAdminSupabase();

    // 1. Upload Cover Image to Supabase Storage
    const coverArrayBuffer = await coverImageFile.arrayBuffer();
    const coverBuffer = Buffer.from(coverArrayBuffer);
    
    const coverExtension = coverImageFile.name.split('.').pop() || 'jpg';
    const cleanedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    const coverFileName = `${Date.now()}_${cleanedTitle}_cover.${coverExtension}`;

    const { error: coverUploadError } = await adminSupabase.storage
      .from('paintings')
      .upload(coverFileName, coverBuffer, {
        contentType: coverImageFile.type || 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      });

    if (coverUploadError) {
      console.error('Supabase cover storage upload error:', coverUploadError);
      return NextResponse.json(
        { error: `Cover image upload failed: ${coverUploadError.message}` },
        { status: 500 }
      );
    }
    
    uploadedFiles.push(coverFileName);

    // Get Cover Public URL
    const { data: coverUrlData } = adminSupabase.storage
      .from('paintings')
      .getPublicUrl(coverFileName);
    const coverImageUrl = coverUrlData.publicUrl;

    // 2. Upload Secondary Images to Supabase Storage
    const additionalImagesUrls: string[] = [];

    for (let i = 0; i < secondaryImageFiles.length; i++) {
      const file = secondaryImageFiles[i];
      // Skip empty file handles
      if (file.size === 0 || !file.name) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${cleanedTitle}_gallery_${i + 1}.${ext}`;

      const { error: uploadError } = await adminSupabase.storage
        .from('paintings')
        .upload(fileName, buffer, {
          contentType: file.type || 'image/jpeg',
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadError) {
        console.error(`Supabase secondary image ${i + 1} upload error:`, uploadError);
        // Clean up previously uploaded files
        await adminSupabase.storage.from('paintings').remove(uploadedFiles);
        return NextResponse.json(
          { error: `Gallery image ${i + 1} upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      uploadedFiles.push(fileName);

      const { data: urlData } = adminSupabase.storage
        .from('paintings')
        .getPublicUrl(fileName);
      additionalImagesUrls.push(urlData.publicUrl);
    }

    // 3. Insert metadata record in the database
    const { data: painting, error: dbError } = await adminSupabase
      .from('paintings')
      .insert({
        title,
        description: description || null,
        price,
        image_url: coverImageUrl,
        additional_images: additionalImagesUrls,
        dimensions: dimensions || null,
        medium: medium || null,
        status: 'available',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase DB insert error:', dbError);
      // Clean up uploaded files if DB insertion failed
      await adminSupabase.storage.from('paintings').remove(uploadedFiles);
      
      return NextResponse.json(
        { error: `Database entry creation failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, painting });
  } catch (error) {
    console.error('Paintings upload API error:', error);
    // Attempt cleanup if any files were uploaded
    if (uploadedFiles.length > 0) {
      try {
        const adminSupabase = getAdminSupabase();
        await adminSupabase.storage.from('paintings').remove(uploadedFiles);
      } catch (cleanupErr) {
        console.error('Failed to cleanup files on fatal error:', cleanupErr);
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred during processing' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminSupabase = getAdminSupabase();
    const { data: paintings, error } = await adminSupabase
      .from('paintings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch admin paintings error:', error);
      return NextResponse.json(
        { error: `Failed to retrieve catalog: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ paintings });
  } catch (error) {
    console.error('GET admin paintings error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
