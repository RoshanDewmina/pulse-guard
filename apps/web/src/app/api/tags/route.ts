import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tags
 * Get all tags for an organization
 */
export async function GET(req: NextRequest) {
  // Tags API disabled - model doesn't exist in schema
  return NextResponse.json({ error: 'Tags not implemented' }, { status: 501 });
}

/**
 * POST /api/tags
 * Create a new tag
 */
export async function POST(req: NextRequest) {
  // Tags API disabled - model doesn't exist in schema
  return NextResponse.json({ error: 'Tags not implemented' }, { status: 501 });
}