import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daw = searchParams.get('daw')?.trim();
    const pluginName = searchParams.get('plugin')?.trim();
    const search = searchParams.get('q')?.trim();

    const pool = getDbPool();

    let query = `
      SELECT
        pc.id,
        pc.owner_id,
        pc.name,
        pc.daw,
        pc.description,
        pc.created_at,
        pc.updated_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS owner_name,
        p.avatar_url,
        COUNT(pci.id)::int AS plugin_count
      FROM public.plugin_chains pc
      LEFT JOIN public.profiles p ON pc.owner_id = p.id
      LEFT JOIN public.plugin_chain_items pci ON pc.id = pci.chain_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (daw) {
      params.push(`%${daw}%`);
      conditions.push(`pc.daw ILIKE $${params.length}`);
    }

    if (pluginName) {
      params.push(`%${pluginName}%`);
      conditions.push(`EXISTS (
        SELECT 1 FROM public.plugin_chain_items sub_pci
        WHERE sub_pci.chain_id = pc.id AND sub_pci.plugin_name ILIKE $${params.length}
      )`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(pc.name ILIKE $${params.length} OR pc.description ILIKE $${params.length} OR pc.daw ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')} `;
    }

    query += `
      GROUP BY pc.id, p.server_display_name, p.display_name, p.email, p.avatar_url
      ORDER BY pc.updated_at DESC
    `;

    const res = await pool.query(query, params);

    return NextResponse.json({
      chains: res.rows,
    });
  } catch (err: any) {
    console.error('[plugin-chains/list] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a plugin chain.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, daw, description, items } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Chain name is required.' }, { status: 400 });
    }

    if (!daw || typeof daw !== 'string' || !daw.trim()) {
      return NextResponse.json({ error: 'DAW is required.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one plugin is required in the chain.' }, { status: 400 });
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const chainRes = await client.query(
        `INSERT INTO public.plugin_chains (owner_id, name, daw, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING *`,
        [user.id, name.trim(), daw.trim(), description?.trim() || null]
      );

      const chain = chainRes.rows[0];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const pluginName = (item.plugin_name || item.name || '').trim();
        if (!pluginName) continue;

        await client.query(
          `INSERT INTO public.plugin_chain_items
            (chain_id, position, plugin_name, vendor, category, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            chain.id,
            item.position || i + 1,
            pluginName,
            item.vendor?.trim() || null,
            item.category?.trim() || null,
            item.notes?.trim() || null,
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        chain,
        message: 'Plugin chain created successfully!',
      }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[plugin-chains/create] Error:', err);
    return NextResponse.json({ error: err.message || 'Error creating chain.' }, { status: 500 });
  }
}
