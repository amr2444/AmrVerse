// Email service using Resend
import { Resend } from 'resend';

const ADMIN_EMAIL = 'akef.minato@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY not set. Using dummy client.');
      // Use dummy key to prevent build errors
      resend = new Resend('re_dummy_key_for_build');
    } else {
      resend = new Resend(apiKey);
    }
  }
  return resend;
}

interface CreatorRequestNotification {
  userName: string;
  userEmail: string;
  motivation: string;
  presentation: string;
  portfolioUrl?: string;
  requestId: string;
  approveUrl: string;
  rejectUrl: string;
}

interface CreatorApprovalNotification {
  userName: string;
  userEmail: string;
}

interface CreatorRejectionNotification {
  userName: string;
  userEmail: string;
  reason?: string;
}

export async function sendCreatorRequestToAdmin(data: CreatorRequestNotification) {
  try {
    console.log('[Email] Starting sendCreatorRequestToAdmin...');
    console.log('[Email] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('[Email] RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || FROM_EMAIL);
    console.log('[Email] ADMIN_EMAIL:', ADMIN_EMAIL);
    
    // Skip if no API key configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] ⚠️ No RESEND_API_KEY found - email will not be sent');
      return { success: true };
    }

    const client = getResendClient();
    console.log('[Email] Resend client initialized');
    
    const { data: emailData, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🎨 Nouvelle demande créateur - ${data.userName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .section { margin-bottom: 25px; }
              .section h3 { color: #667eea; margin-bottom: 10px; }
              .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; }
              .actions { margin-top: 30px; text-align: center; }
              .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .approve-btn { background: #10b981; color: white; }
              .reject-btn { background: #ef4444; color: white; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎨 Nouvelle Demande Créateur</h1>
              </div>
              
              <div class="content">
                <div class="section">
                  <h3>👤 Informations du candidat</h3>
                  <div class="info-box">
                    <p><strong>Nom:</strong> ${data.userName}</p>
                    <p><strong>Email:</strong> ${data.userEmail}</p>
                    ${data.portfolioUrl ? `<p><strong>Portfolio:</strong> <a href="${data.portfolioUrl}" target="_blank">${data.portfolioUrl}</a></p>` : ''}
                  </div>
                </div>

                <div class="section">
                  <h3>📝 Présentation</h3>
                  <div class="info-box">
                    <p>${data.presentation.replace(/\n/g, '<br>')}</p>
                  </div>
                </div>

                <div class="section">
                  <h3>💡 Motivation</h3>
                  <div class="info-box">
                    <p>${data.motivation.replace(/\n/g, '<br>')}</p>
                  </div>
                </div>

                <div class="actions">
                  <p style="margin-bottom: 20px;"><strong>Actions rapides:</strong></p>
                  <a href="${data.approveUrl}" class="button approve-btn">✅ Approuver</a>
                  <a href="${data.rejectUrl}" class="button reject-btn">❌ Rejeter</a>
                </div>

                <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 5px; font-size: 14px;">
                  💡 <strong>Astuce:</strong> Vous pouvez aussi gérer cette demande depuis votre panel admin.
                </p>
              </div>

              <div class="footer">
                <p>AmrVerse - Plateforme de Lecture de Manhwa</p>
                <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Error sending admin notification:', error);
      return { success: false, error };
    }

    console.log('[Email] Admin notification sent:', emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('[Email] Failed to send admin notification:', error);
    return { success: false, error };
  }
}

export async function sendCreatorApprovalEmail(data: CreatorApprovalNotification) {
  try {
    // Skip if no API key configured
    if (!process.env.RESEND_API_KEY) {
      console.log('[Email] Skipping approval email (no API key configured)');
      return { success: true };
    }

    const client = getResendClient();
    const { data: emailData, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: '🎉 Félicitations ! Votre demande créateur a été approuvée',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .celebration { font-size: 60px; text-align: center; margin: 20px 0; }
              .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .features { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .features ul { list-style: none; padding: 0; }
              .features li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .features li:last-child { border-bottom: none; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Félicitations ${data.userName} !</h1>
                <p style="font-size: 18px; margin-top: 10px;">Vous êtes maintenant un créateur officiel AmrVerse</p>
              </div>
              
              <div class="content">
                <div class="celebration">🎨✨🚀</div>
                
                <p style="font-size: 16px; text-align: center; margin-bottom: 30px;">
                  Nous sommes ravis de vous accueillir dans notre communauté de créateurs !
                </p>

                <div class="features">
                  <h3 style="color: #667eea; margin-bottom: 15px;">🎯 Ce que vous pouvez faire maintenant:</h3>
                  <ul>
                    <li>✅ Créer et publier vos propres manhwas</li>
                    <li>✅ Uploader des chapitres et des pages</li>
                    <li>✅ Gérer votre contenu depuis le portail créateur</li>
                    <li>✅ Interagir avec votre communauté de lecteurs</li>
                    <li>✅ Suivre les statistiques de vos œuvres</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/upload-content" class="button">
                    🚀 Commencer à créer
                  </a>
                </div>

                <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin-top: 30px;">
                  <p style="margin: 0; font-size: 14px;">
                    💡 <strong>Conseil:</strong> Commencez par créer votre premier manhwa, puis ajoutez des chapitres progressivement. 
                    N'hésitez pas à explorer le portail créateur pour découvrir toutes les fonctionnalités !
                  </p>
                </div>
              </div>

              <div class="footer">
                <p>Bienvenue dans la famille AmrVerse ! 🎨</p>
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Error sending approval email:', error);
      return { success: false, error };
    }

    console.log('[Email] Approval email sent:', emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('[Email] Failed to send approval email:', error);
    return { success: false, error };
  }
}

export async function sendCreatorRejectionEmail(data: CreatorRejectionNotification) {
  try {
    // Skip if no API key configured
    if (!process.env.RESEND_API_KEY) {
      console.log('[Email] Skipping rejection email (no API key configured)');
      return { success: true };
    }

    const client = getResendClient();
    const { data: emailData, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: 'Mise à jour de votre demande créateur AmrVerse',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .message-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #6b7280; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Mise à jour de votre demande</h1>
              </div>
              
              <div class="content">
                <p>Bonjour ${data.userName},</p>

                <p>Merci pour l'intérêt que vous portez à devenir créateur sur AmrVerse.</p>

                <div class="message-box">
                  <p>Après examen de votre candidature, nous avons décidé de ne pas l'accepter pour le moment.</p>
                  ${data.reason ? `
                    <p><strong>Raison:</strong></p>
                    <p>${data.reason.replace(/\n/g, '<br>')}</p>
                  ` : ''}
                </div>

                <p>Nous vous encourageons à continuer à profiter de la plateforme en tant que lecteur et à soumettre une nouvelle demande dans le futur si vous le souhaitez.</p>

                <div style="text-align: center;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/library" class="button">
                    📚 Retour à la bibliothèque
                  </a>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  Si vous avez des questions, n'hésitez pas à nous contacter.
                </p>
              </div>

              <div class="footer">
                <p>AmrVerse - Plateforme de Lecture de Manhwa</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Error sending rejection email:', error);
      return { success: false, error };
    }

    console.log('[Email] Rejection email sent:', emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('[Email] Failed to send rejection email:', error);
    return { success: false, error };
  }
}
