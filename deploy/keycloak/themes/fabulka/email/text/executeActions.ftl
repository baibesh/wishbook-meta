<#ftl output_format="plainText">
<#assign requiredActionsText><#if requiredActions??><#list requiredActions><#items as reqActionItem>${msg("requiredAction.${reqActionItem}")}<#sep>, </#items></#list></#if></#assign>
<#if user.firstName?has_content>${msg("fabulkaHelloName", user.firstName)}<#else>${msg("fabulkaHello")}</#if>

${msg("fabulkaActionsText", requiredActionsText)}

${msg("fabulkaActionsButton")}: ${link}

${msg("fabulkaLinkExpires", linkExpirationFormatter(linkExpiration))} ${msg("fabulkaActionsIgnore")}

--
Fabulka · https://fabulka.com
