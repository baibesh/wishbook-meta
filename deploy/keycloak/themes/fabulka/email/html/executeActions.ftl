<#outputformat "plainText">
<#assign requiredActionsText><#if requiredActions??><#list requiredActions><#items as reqActionItem>${msg("requiredAction.${reqActionItem}")}<#sep>, </#sep></#items></#list></#if></#assign>
</#outputformat>
<#import "template.ftl" as layout>
<@layout.emailLayout heading=msg("fabulkaActionsHeading") button=msg("fabulkaActionsButton") link=link>
<p style="margin:0 0 12px 0;"><#if user.firstName?has_content>${msg("fabulkaHelloName", user.firstName)}<#else>${msg("fabulkaHello")}</#if></p>
<p style="margin:0 0 12px 0;">${msg("fabulkaActionsText", requiredActionsText)}</p>
<p style="margin:0;color:#7a6a5c;">${msg("fabulkaLinkExpires", linkExpirationFormatter(linkExpiration))} ${msg("fabulkaActionsIgnore")}</p>
</@layout.emailLayout>
