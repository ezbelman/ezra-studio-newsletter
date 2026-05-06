interface Story {
  headline: string
  body: string
  url?: string
}

interface PolishedJson {
  title: string
  stories?: Story[]
  prompts?: string[]
  hot_take?: string
}

interface TemplateOptions {
  orgName:      string
  primaryColor: string
  issueTitle:   string
  polishedJson: PolishedJson
  unsubscribeUrl: string
  webViewUrl?:  string
}

export function renderEmailHtml(opts: TemplateOptions): string {
  const { orgName, primaryColor, issueTitle, polishedJson, unsubscribeUrl, webViewUrl } = opts
  const color = primaryColor || '#7B5CF0'

  const storiesHtml = (polishedJson.stories ?? []).map(story => `
    <tr>
      <td style="padding: 0 0 28px 0;">
        <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #F0F0F5; line-height: 1.4;">
          ${escapeHtml(story.headline)}
        </h2>
        <p style="margin: 0 0 10px 0; font-size: 15px; color: #8888A0; line-height: 1.7;">
          ${escapeHtml(story.body)}
        </p>
        ${story.url ? `
        <a href="${escapeHtml(story.url)}"
           style="display: inline-block; font-size: 13px; font-weight: 600; color: ${color}; text-decoration: none;">
          Read more →
        </a>` : ''}
      </td>
    </tr>`).join('')

  const promptsHtml = polishedJson.prompts && polishedJson.prompts.length > 0 ? `
    <tr>
      <td style="padding: 0 0 28px 0;">
        <div style="background: #1A1A24; border-left: 3px solid ${color}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${color};">
            Prompts to explore
          </p>
          ${polishedJson.prompts.map(p => `
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #8888A0; line-height: 1.5;">
            · ${escapeHtml(p)}
          </p>`).join('')}
        </div>
      </td>
    </tr>` : ''

  const hotTakeHtml = polishedJson.hot_take ? `
    <tr>
      <td style="padding: 0 0 28px 0;">
        <div style="background: linear-gradient(135deg, rgba(123,92,240,0.15), rgba(79,142,247,0.15)); border: 1px solid rgba(123,92,240,0.3); border-radius: 12px; padding: 20px 24px;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${color};">
            Hot take
          </p>
          <p style="margin: 0; font-size: 15px; color: #F0F0F5; line-height: 1.7; font-style: italic;">
            "${escapeHtml(polishedJson.hot_take)}"
          </p>
        </div>
      </td>
    </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(issueTitle)}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${escapeHtml(issueTitle)} — ${escapeHtml(orgName)}
  </div>

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width: 600px; width: 100%; background-color: #111118; border: 1px solid #2A2A38; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 40px 24px; border-bottom: 1px solid #2A2A38;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background: linear-gradient(135deg, #7B5CF0, #4F8EF7); border-radius: 8px; width: 28px; height: 28px; line-height: 28px; text-align: center; font-weight: 900; font-size: 11px; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">
                      NS
                    </div>
                    <span style="font-size: 14px; font-weight: 600; color: #F0F0F5; margin-left: 10px; vertical-align: middle;">
                      ${escapeHtml(orgName)}
                    </span>
                  </td>
                  ${webViewUrl ? `
                  <td align="right">
                    <a href="${escapeHtml(webViewUrl)}" style="font-size: 12px; color: #8888A0; text-decoration: none;">
                      View in browser
                    </a>
                  </td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 36px 40px 28px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #F0F0F5; line-height: 1.3;">
                ${escapeHtml(issueTitle)}
              </h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px 28px;">
              <div style="height: 1px; background: linear-gradient(90deg, ${color}, transparent);"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${storiesHtml}
                ${promptsHtml}
                ${hotTakeHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #2A2A38;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #55556A; text-align: center; line-height: 1.6;">
                You are receiving this because you subscribed to ${escapeHtml(orgName)}.
              </p>
              <p style="margin: 0; font-size: 12px; text-align: center;">
                <a href="${escapeHtml(unsubscribeUrl)}"
                   style="color: #55556A; text-decoration: underline;">
                  Unsubscribe
                </a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
