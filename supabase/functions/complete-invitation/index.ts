import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, password, email, full_name, role } = await req.json()

    console.log('Completing invitation for:', email)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First validate the token again and mark as used
    const { data: tokenRecord, error: tokenError } = await supabaseClient
      .from('user_invitations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenRecord) {
      throw new Error('Token tidak valid atau sudah kedaluwarsa')
    }

    // Mark token as used
    const { error: updateError } = await supabaseClient
      .from('user_invitations')
      .update({ used: true })
      .eq('id', tokenRecord.id)

    if (updateError) {
      console.error('Error updating token:', updateError)
    }

    // Create user from invitation
    const { data: userId, error: createError } = await supabaseClient
      .rpc('create_user_from_invitation', {
        p_email: email,
        p_full_name: full_name,
        p_role: role,
        p_password: password
      })

    if (createError) {
      throw new Error(createError.message)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account created successfully',
        user_id: userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})