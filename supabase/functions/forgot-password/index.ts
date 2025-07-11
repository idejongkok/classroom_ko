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
    const { email } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create password reset token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .rpc('create_password_reset_token', {
        p_email: email
      })

    if (tokenError) {
      throw new Error(tokenError.message)
    }

    const token = tokenData
    // Use classroom.kelasotomesyen.com as the target domain
    const resetUrl = `https://classroom.kelasotomesyen.com/reset-password/${token}`

    // Get user info for personalization
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .single()

    const userName = userProfile?.full_name || 'User'

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - Kelas Otomesyen</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Password</h1>
            <p>Kelas Otomesyen Classroom</p>
          </div>
          
          <div class="content">
            <h2>Halo ${userName}!</h2>
            
            <p>Kami menerima permintaan untuk mereset password akun Anda di <strong>Kelas Otomesyen Classroom</strong>.</p>
            
            <p>Jika Anda yang meminta reset password, silakan klik tombol di bawah ini:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password Saya</a>
            </div>
            
            <div class="warning-box">
              <h3>⚠️ Penting:</h3>
              <ul>
                <li>Link ini akan kedaluwarsa dalam <strong>1 jam</strong></li>
                <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                <li>Password Anda tidak akan berubah sampai Anda mengklik link di atas</li>
              </ul>
            </div>
            
            <p>Jika tombol di atas tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
            
            <p>Jika Anda mengalami masalah atau tidak meminta reset password ini, hubungi administrator segera.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Kelas Otomesyen. All rights reserved.</p>
            <p>Email ini dikirim secara otomatis, mohon jangan membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Kelas Otomesyen <noreply@kelasotomesyen.com>',
        to: [email],
        subject: 'Reset Password - Kelas Otomesyen Classroom',
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully'
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