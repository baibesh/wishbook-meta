<#import "template.ftl" as layout>
<@layout.emailLayout heading=msg("fabulkaVerifyHeading") button=msg("fabulkaVerifyButton") link=link>
<p style="margin:0 0 12px 0;"><#if user.firstName?has_content>${msg("fabulkaHelloName", user.firstName)}<#else>${msg("fabulkaHello")}</#if></p>
<p style="margin:0 0 12px 0;">${msg("fabulkaVerifyText")}</p>
<p style="margin:0;color:#7a6a5c;">${msg("fabulkaLinkExpires", linkExpirationFormatter(linkExpiration))} ${msg("fabulkaVerifyIgnore")}</p>
</@layout.emailLayout>
