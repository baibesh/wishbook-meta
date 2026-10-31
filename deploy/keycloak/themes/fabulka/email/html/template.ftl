<#--
  Fabulka email layout. Table-based with inline styles so it renders in Gmail,
  Outlook and Apple Mail. Every HTML email of the realm goes through this macro,
  including the stock ones we do not override (they pass only nested content).
-->
<#macro emailLayout heading="" button="" link="">
<!DOCTYPE html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${realmName!"Fabulka"}</title>
</head>
<body style="margin:0;padding:0;background:#fffaf3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffaf3;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding:0 0 20px 0;">
            <a href="${properties.siteUrl!"https://fabulka.com"}" style="text-decoration:none;color:#2b2118;">
              <img src="${properties.logoUrl!""}" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:10px;">
              <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:800;color:#2b2118;">Fabulka</span>
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #eadfce;border-radius:20px;padding:32px 28px;font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#2b2118;">
            <#if heading?has_content>
            <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;font-weight:800;color:#2b2118;">${heading}</h1>
            </#if>
            <#nested>
            <#if button?has_content && link?has_content>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
              <tr>
                <td align="center" style="border-radius:999px;background:#e8833a;">
                  <a href="${link}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${button}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px 0;font-size:13px;color:#7a6a5c;">${msg("fabulkaButtonFallback")}</p>
            <p style="margin:0;font-size:13px;word-break:break-all;"><a href="${link}" style="color:#c4621d;">${link}</a></p>
            </#if>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 8px 0 8px;font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#7a6a5c;">
            ${msg("fabulkaEmailFooter")}<br>
            <a href="${properties.siteUrl!"https://fabulka.com"}" style="color:#7a6a5c;">fabulka.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
</#macro>
