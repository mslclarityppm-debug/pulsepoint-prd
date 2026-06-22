import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUserBadges } from '@/actions/achievements';

export async function GET() {
  try {
    const user = await requireUser();
    const badges = await getUserBadges(user.id);
    return NextResponse.json(badges);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
