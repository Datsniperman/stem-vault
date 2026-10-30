import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/pool';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pool = getDbPool();

    const chainRes = await pool.query(
      `SELECT
        pc.id,
        pc.owner_id,
        pc.name,
        pc.daw,
        pc.description,
        pc.created_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS author
       FROM public.plugin_chains pc
       LEFT JOIN public.profiles p ON pc.owner_id = p.id
       WHERE pc.id = $1`,
      [id]
    );

    if (chainRes.rows.length === 0) {
      return NextResponse.json({ error: 'Plugin chain not found' }, { status: 404 });
    }

    const chain = chainRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT position, plugin_name, vendor, category, notes
       FROM public.plugin_chain_items
       WHERE chain_id = $1
       ORDER BY position ASC`,
      [id]
    );

    const exportPayload = {
      schema_version: '1.0.0',
      name: chain.name,
      daw: chain.daw,
      description: chain.description,
      author: chain.author,
      created_at: chain.created_at,
      exported_at: new Date().toISOString(),
      plugins: itemsRes.rows.map((item, idx) => ({
        position: item.position || idx + 1,
        plugin_name: item.plugin_name,
        vendor: item.vendor || null,
        category: item.category || null,
        notes: item.notes || null,
      })),
    };

    const filename = `${chain.name.replace(/[^\w\-]+/g, '_')}-chain.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('[plugin-chains/export] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
