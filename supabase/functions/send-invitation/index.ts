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
    const { email, full_name, role, created_by } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create invitation token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .rpc('create_user_invitation', {
        p_email: email,
        p_full_name: full_name,
        p_role: role,
        p_created_by: created_by
      })

    if (tokenError) {
      throw new Error(tokenError.message)
    }

    const token = tokenData
    // Use classroom.kelasotomesyen.com as the target domain
    const inviteUrl = `https://classroom.kelasotomesyen.com/invite/${token}`

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const getRoleLabel = (role: string) => {
      const labels = {
        admin: 'Admin',
        instructor: 'Mentor',
        student: 'Siswa'
      };
      return labels[role as keyof typeof labels] || 'Siswa';
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Undangan Kelas Otomesyen</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .info-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Kelas Otomesyen</h1>
            <p>Selamat datang di Classroom Management System</p>
          </div>
          
          <div class="content">
            <h2>Halo ${full_name}!</h2>
            
            <p>Anda telah diundang untuk bergabung dengan <strong>Kelas Otomesyen Classroom</strong> sebagai <strong>${getRoleLabel(role)}</strong>.</p>
            
            <div class="info-box">
              <h3>📋 Detail Akun Anda:</h3>
              <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Nama:</strong> ${full_name}</li>
                <li><strong>Role:</strong> ${getRoleLabel(role)}</li>
              </ul>
            </div>
            
            <p>Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini untuk membuat password:</p>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Buat Password & Aktifkan Akun</a>
            </div>
            
            <p><strong>Catatan Penting:</strong></p>
            <ul>
              <li>Link ini akan kedaluwarsa dalam 7 hari</li>
              <li>Setelah membuat password, Anda dapat langsung login ke sistem</li>
              <li>Jika Anda mengalami masalah, hubungi administrator</li>
            </ul>
            
            <p>Jika tombol di atas tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace;">${inviteUrl}</p>
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
        subject: `Undangan Bergabung - Kelas Otomesyen (${getRoleLabel(role)})`,
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
        message: 'Invitation sent successfully',
        token: token
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