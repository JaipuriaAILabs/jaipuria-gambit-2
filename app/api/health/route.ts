import sql from "@/lib/db";

export const dynamic = "force-dynamic";
export const preferredRegion = "bom1";

// Lightweight reachability probe for the walled-off gambit schema.
export async function GET() {
  try {
    const [r] = await sql`select
      (select count(*)::int from gambit.matches) as matches,
      (select count(*)::int from gambit.matches where status='open') as open_matches,
      (select count(*)::int from gambit.users) as users`;
    return Response.json({ ok: true, region: process.env.VERCEL_REGION ?? "?", ...r });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
