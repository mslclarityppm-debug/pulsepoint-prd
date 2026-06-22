import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getEngagementStats } from '@/actions/achievements';

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getEngagementStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
