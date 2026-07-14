import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AdminAction = 'list' | 'update-role' | 'toggle-active' | 'delete-user';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userResult, error: userError } = await userClient.auth.getUser();
  if (userError || !userResult.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile, error: callerError } = await adminClient
    .from('perfiles')
    .select('rol')
    .eq('usuario_id', userResult.user.id)
    .maybeSingle();

  if (callerError || callerProfile?.rol !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as AdminAction;

  if (action === 'list') {
    const search = typeof body.search === 'string' ? body.search.trim() : '';
    const role = typeof body.role === 'string' ? body.role : 'all';

    const { data, error } = await adminClient
      .from('perfiles')
      .select('id, usuario_id, nombre, edad, peso_kg, altura_cm, nivel_experiencia, objetivo, foto_url, rol, activo, usuarios:usuarios!inner(email)')
      .order('nombre', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const users = (data ?? [])
      .map((item: any) => ({
        id: item.id,
        userId: item.usuario_id,
        nombre: item.nombre,
        email: item.usuarios?.email ?? null,
        role: item.rol ?? 'user',
        active: item.activo ?? true,
        edad: item.edad,
        peso_kg: item.peso_kg,
        altura_cm: item.altura_cm,
        nivel_experiencia: item.nivel_experiencia,
        objetivo: item.objetivo,
        foto_url: item.foto_url,
      }))
      .filter((item: any) => {
        const matchesSearch = !search || `${item.nombre ?? ''} ${item.email ?? ''}`.toLowerCase().includes(search.toLowerCase());
        const matchesRole = role === 'all' || item.role === role;
        return matchesSearch && matchesRole;
      });

    return new Response(JSON.stringify({ users }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'update-role') {
    const { userId, role } = body as { userId?: string; role?: string };
    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await adminClient
      .from('perfiles')
      .update({ rol: role })
      .eq('usuario_id', userId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'toggle-active') {
    const { userId, active } = body as { userId?: string; active?: boolean };
    if (!userId || typeof active !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await adminClient
      .from('perfiles')
      .update({ activo: active })
      .eq('usuario_id', userId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'delete-user') {
    const { userId } = body as { userId?: string };
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await adminClient.from('usuarios').delete().eq('id', userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
});