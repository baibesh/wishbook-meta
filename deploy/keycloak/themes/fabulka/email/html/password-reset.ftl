<#import "template.ftl" as layout>
<@layout.emailLayout heading=msg("fabulkaResetHeading") button=msg("fabulkaResetButton") link=link>
<p style="margin:0 0 12px 0;"><#if user.firstName?has_content>${msg("fabulkaHelloName", user.firstName)}<#else>${msg("fabulkaHello")}</#if></p>
<p style="margin:0 0 12px 0;">${msg("fabulkaResetText")}</p>
<p style="margin:0;color:#7a6a5c;">${msg("fabulkaLinkExpires", linkExpirationFormatter(linkExpiration))} ${msg("fabulkaResetIgnore")}</p>
</@layout.emailLayout>
