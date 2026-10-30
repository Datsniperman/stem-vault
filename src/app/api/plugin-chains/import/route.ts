import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';

export async function POST(request: NextRequest) {
  try {
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to import a plugin chain.' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    // Schema Validation
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload structure. Expected an object.' }, { status: 400 });
    }

    if (!payload.schema_version || typeof payload.schema_version !== 'string') {
      return NextResponse.json({ error: 'Missing required field: schema_version.' }, { status: 400 });
    }

    if (payload.schema_version !== '1.0.0') {
      return NextResponse.json(
        { error: `Unsupported schema version: '${payload.schema_version}'. Supported version is '1.0.0'.` },
        { status: 400 }
      );
    }

    if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
      return NextResponse.json({ error: 'Missing or invalid field: name.' }, { status: 400 });
    }

    if (!payload.daw || typeof payload.daw !== 'string' || !payload.daw.trim()) {
      return NextResponse.json({ error: 'Missing or invalid field: daw.' }, { status: 400 });
    }

    if (!Array.isArray(payload.plugins) || payload.plugins.length === 0) {
      return NextResponse.json({ error: 'The chain must contain at least one plugin in the plugins array.' }, { status: 400 });
    }

    for (let i = 0; i < payload.plugins.length; i++) {
      const p = payload.plugins[i];
      if (!p || typeof p !== 'object' || !p.plugin_name || typeof p.plugin_name !== 'string' || !p.plugin_name.trim()) {
        return NextResponse.json(
          { error: `Plugin at index ${i} is missing a valid 'plugin_name'.` },
          { status: 400 }
        );
      }
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const chainRes = await client.query(
        `INSERT INTO public.plugin_chains (owner_id, name, daw, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING *`,
        [
          user.id,
          payload.name.trim(),
          payload.daw.trim(),
          payload.description?.trim() || null,
        ]
      );

      const chain = chainRes.rows[0];

      for (let i = 0; i < payload.plugins.length; i++) {
        const p = payload.plugins[i];
        await client.query(
          `INSERT INTO public.plugin_chain_items
            (chain_id, position, plugin_name, vendor, category, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            chain.id,
            p.position || i + 1,
            p.plugin_name.trim(),
            p.vendor?.trim() || null,
            p.category?.trim() || null,
            p.notes?.trim() || null,
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        chain,
        message: `Imported '${chain.name}' successfully with ${payload.plugins.length} plugins!`,
      }, { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[plugin-chains/import] Error:', err);
    return NextResponse.json({ error: err.message || 'Error importing chain.' }, { status: 500 });
  }
}
