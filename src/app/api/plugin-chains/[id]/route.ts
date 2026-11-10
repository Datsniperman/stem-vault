import { NextRequest, NextResponse } from 'next/server';
import { createDbServerClient } from '@/lib/db/server';
import { getDbPool } from '@/lib/db/pool';
import { isUserAdmin } from '@/lib/auth/admin';

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
        pc.updated_at,
        COALESCE(p.server_display_name, p.display_name, p.email, 'Member') AS owner_name,
        p.avatar_url
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
      `SELECT id, chain_id, position, plugin_name, vendor, category, notes
       FROM public.plugin_chain_items
       WHERE chain_id = $1
       ORDER BY position ASC`,
      [id]
    );

    return NextResponse.json({
      chain: {
        ...chain,
        plugin_count: itemsRes.rows.length,
        items: itemsRes.rows,
      },
    });
  } catch (err: any) {
    console.error('[plugin-chains/detail] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const checkRes = await pool.query(
      `SELECT pc.id, pc.owner_id, p.role
       FROM public.plugin_chains pc
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE pc.id = $2`,
      [user.id, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Plugin chain not found' }, { status: 404 });
    }

    const chain = checkRes.rows[0];
    const isAdmin =
      chain.role === 'admin' ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    const isOwner = chain.owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: you cannot edit this chain.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, daw, description, items, owner_id } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE public.plugin_chains
         SET name = COALESCE($1, name),
             daw = COALESCE($2, daw),
             description = $3,
             owner_id = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE owner_id END,
             updated_at = now()
         WHERE id = $5`,
        [
          name?.trim(),
          daw?.trim(),
          description !== undefined ? description?.trim() : null,
          isAdmin && owner_id ? owner_id : null,
          id,
        ]
      );

      if (Array.isArray(items)) {
        await client.query(`DELETE FROM public.plugin_chain_items WHERE chain_id = $1`, [id]);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const pluginName = (item.plugin_name || item.name || '').trim();
          if (!pluginName) continue;

          await client.query(
            `INSERT INTO public.plugin_chain_items
              (chain_id, position, plugin_name, vendor, category, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              id,
              item.position || i + 1,
              pluginName,
              item.vendor?.trim() || null,
              item.category?.trim() || null,
              item.notes?.trim() || null,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Chain updated successfully!' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[plugin-chains/update] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await createDbServerClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    const checkRes = await pool.query(
      `SELECT pc.id, pc.owner_id, p.role
       FROM public.plugin_chains pc
       LEFT JOIN public.profiles p ON p.id = $1
       WHERE pc.id = $2`,
      [user.id, id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Plugin chain not found' }, { status: 404 });
    }

    const chain = checkRes.rows[0];
    const isAdmin =
      chain.role === 'admin' ||
      user.role === 'admin' ||
      isUserAdmin({
        email: user.email,
        discordId: user.user_metadata?.provider_id || (user.identities && user.identities[0]?.id),
        username: user.user_metadata?.server_display_name || user.user_metadata?.display_name,
        role: user.role,
        userMetadata: user.user_metadata,
      });

    const isOwner = chain.owner_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: you cannot delete this chain.' }, { status: 403 });
    }

    await pool.query(`DELETE FROM public.plugin_chains WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Chain deleted successfully.' });
  } catch (err: any) {
    console.error('[plugin-chains/delete] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
