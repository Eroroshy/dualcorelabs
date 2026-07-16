import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AdminAction = 'list' | 'update-role' | 'toggle-active' | 'delete-user';

// Cabeceras CORS necesarias para permitir peticiones desde localhost y Expo Web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

serve(async (req: Request) => {
  // Manejo del Preflight de CORS (Petición OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validar el token JWT del usuario que hace la petición
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userResult, error: userError } = await userClient.auth.getUser();
    if (userError || !userResult.user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar si el usuario es administrador en la base de datos
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile, error: callerError } = await adminClient
      .from('usuarios')
      .select('rol')
      .eq('usuario_id', userResult.user.id)
      .maybeSingle();

    if (callerError || callerProfile?.rol !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, { status: 403 });
    }

// Reemplaza la línea vieja de const body = await req.json().catch(...) por esto:
let body: any = {};
try {
  const rawBody = await req.text();
  body = rawBody ? JSON.parse(rawBody) : {};
} catch (e) {
  return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
}

const action = body.action as AdminAction;

// --- ACCIÓN: LISTAR USUARIOS ---
if (action === 'list') {
  const search = typeof body.search === 'string' ? body.search.trim() : '';
  const role = typeof body.role === 'string' ? body.role : 'all';

  // 1. Traemos todos los usuarios desde la tabla pública
  const { data: usuariosData, error: usuariosError } = await adminClient
    .from('usuarios')
    .select('id, usuario_id, nombre, edad, peso_kg, altura_cm, nivel_experiencia, objetivo, foto_url, rol, activo')
    .order('nombre', { ascending: true });

  if (usuariosError) {
    return jsonResponse({ error: usuariosError.message }, { status: 500 });
  }

  // 2. Traemos todos los usuarios del sistema de Autenticación de Supabase (aquí están los emails)
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();

  if (authError) {
    return jsonResponse({ error: authError.message }, { status: 500 });
  }

  // Crear un mapa rápido de usuario_id -> email para cruzar los datos eficientemente
  const emailMap = new Map<string, string>();
  if (authData && authData.users) {
    authData.users.forEach((u: any) => {
      if (u.id && u.email) {
        emailMap.set(u.id, u.email);
      }
    });
  }

  // 3. Cruzamos los datos en memoria
  const users = (usuariosData ?? [])
    .map((item: any) => ({
      id: item.id,
      userId: item.usuario_id,
      nombre: item.nombre,
      // Buscamos el email usando el usuario_id del perfil
      email: emailMap.get(item.usuario_id) ?? null, 
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

  return jsonResponse({ users });
}

    // --- ACCIÓN: ACTUALIZAR ROL ---
    if (action === 'update-role') {
      const { userId, role } = body as { userId?: string; role?: string };
      if (!userId || !role) {
        return jsonResponse({ error: 'Missing parameters' }, { status: 400 });
      }

      const { error } = await adminClient
        .from('usuarios')
        .update({ rol: role })
        .eq('usuario_id', userId);

      if (error) {
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      return jsonResponse({ success: true });
    }

    // --- ACCIÓN: ACTIVAR/DESACTIVAR USUARIO ---
    if (action === 'toggle-active') {
      const { userId, active } = body as { userId?: string; active?: boolean };
      if (!userId || typeof active !== 'boolean') {
        return jsonResponse({ error: 'Missing parameters' }, { status: 400 });
      }

      const { error } = await adminClient
        .from('usuarios')
        .update({ activo: active })
        .eq('usuario_id', userId);

      if (error) {
        return jsonResponse({ error: error.message }, { status: 500 });
      }

      return jsonResponse({ success: true });
    }

    // --- ACCIÓN: ELIMINAR USUARIO ---
// --- ACCIÓN: ELIMINAR USUARIO ---
if (action === 'delete-user') {
  const { userId } = body as { userId?: string };
  if (!userId) {
    return jsonResponse({ error: 'Missing parameters' }, { status: 400 });
  }

  // Eliminación directa desde el sistema de Auth de Supabase (borra el perfil si tienes ON DELETE CASCADE)
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  
  if (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }

  return jsonResponse({ success: true });
}

    return jsonResponse({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: message }, { status: 500 });
  }
});