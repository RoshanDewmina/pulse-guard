import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/tags/[id]
 * Delete a tag
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Tags API disabled - model doesn't exist in schema
  return NextResponse.json({ error: 'Tags not implemented' }, { status: 501 });
}