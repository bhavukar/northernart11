import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

// Helper to extract storage path/filename from a public Supabase URL
function getStorageFileName(url: string): string | null {
  try {
    const parts = url.split('/paintings/');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return null;
  } catch (e) {
    return null;
  }
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const adminSupabase = getAdminSupabase();

    // Prepare fields for updates
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.medium !== undefined) updates.medium = body.medium;
    if (body.dimensions !== undefined) updates.dimensions = body.dimensions;
    if (body.status !== undefined) {
      if (body.status !== 'available' && body.status !== 'sold') {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.price !== undefined) {
      const priceVal = parseFloat(body.price);
      if (isNaN(priceVal) || priceVal <= 0) {
        return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
      }
      updates.price = Math.round(priceVal * 100); // convert to paise
    }

    const { data: painting, error: dbError } = await adminSupabase
      .from('paintings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('Failed to update painting:', dbError);
      return NextResponse.json(
        { error: `Database update failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, painting });
  } catch (error) {
    console.error('PATCH painting error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const adminSupabase = getAdminSupabase();

    // 1. Retrieve painting details first to find the file URLs for deletion
    const { data: painting, error: fetchError } = await adminSupabase
      .from('paintings')
      .select('image_url, additional_images')
      .eq('id', id)
      .single();

    if (fetchError || !painting) {
      return NextResponse.json(
        { error: 'Painting not found for deletion' },
        { status: 404 }
      );
    }

    // 2. Compile list of storage file paths to clean up
    const filesToDelete: string[] = [];
    
    const mainFile = getStorageFileName(painting.image_url);
    if (mainFile) filesToDelete.push(mainFile);

    if (painting.additional_images && Array.isArray(painting.additional_images)) {
      painting.additional_images.forEach((url: any) => {
        if (typeof url === 'string') {
          const file = getStorageFileName(url);
          if (file) filesToDelete.push(file);
        }
      });
    }

    // 3. Delete database record
    const { error: deleteDbError } = await adminSupabase
      .from('paintings')
      .delete()
      .eq('id', id);

    if (deleteDbError) {
      console.error('Failed to delete db record:', deleteDbError);
      return NextResponse.json(
        { error: `Database deletion failed: ${deleteDbError.message}` },
        { status: 500 }
      );
    }

    // 4. Remove all files from Supabase Storage
    if (filesToDelete.length > 0) {
      const { error: storageDeleteError } = await adminSupabase.storage
        .from('paintings')
        .remove(filesToDelete);

      if (storageDeleteError) {
        console.warn('Warning: Storage cleanup failed for files:', filesToDelete, storageDeleteError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE painting error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during deletion' },
      { status: 500 }
    );
  }
}
