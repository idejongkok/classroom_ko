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
    const { token, password } = await req.json()

    console.log('Resetting password with token:', token)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First validate the token and get email
    const { data: tokenRecord, error: tokenError } = await supabaseClient
      .from('password_reset_tokens')
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
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenRecord.id)

    if (updateError) {
      console.error('Error updating token:', updateError)
    }

    // Reset the password
    const { data: resetSuccess, error: resetError } = await supabaseClient
      .rpc('reset_user_password', {
        p_email: tokenRecord.email,
        p_new_password: password
      })

    if (resetError) {
      throw new Error(resetError.message)
    }

    if (!resetSuccess) {
      throw new Error('Gagal mereset password')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully'
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