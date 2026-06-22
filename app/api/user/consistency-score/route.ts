import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUserConsistencyScore } from '@/lib/achievements-utils';

export async function GET() {
  try {
    const user = await requireUser();
    const score = await getUserConsistencyScore(user.id);
    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
