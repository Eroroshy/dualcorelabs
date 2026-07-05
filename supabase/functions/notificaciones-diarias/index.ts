import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  // 1. Conexión segura a tu base de datos
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. Extraer a todos los usuarios que ya tienen un Token guardado
  const { data: perfiles, error } = await supabase
    .from('perfiles')
    .select('push_token')
    .not('push_token', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // 3. Armar los mensajes para Expo
  const messages = perfiles.map((perfil: any) => ({
    to: perfil.push_token,
    sound: 'default',
    title: '¡Es hora de moverte!',
    body: 'El sedentarismo no descansa, y nosotros tampoco. ¡Registra tu actividad de hoy en Kinetic!',
  }))

  // 4. Disparar los mensajes a los servidores de Expo
  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  return new Response(JSON.stringify({ success: true, enviados: messages.length }), { 
    headers: { "Content-Type": "application/json" } 
  })
})