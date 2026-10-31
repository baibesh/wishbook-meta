<#ftl output_format="plainText">
<#if user.firstName?has_content>${msg("fabulkaHelloName", user.firstName)}<#else>${msg("fabulkaHello")}</#if>

${msg("fabulkaResetText")}

${msg("fabulkaResetButton")}: ${link}

${msg("fabulkaLinkExpires", linkExpirationFormatter(linkExpiration))} ${msg("fabulkaResetIgnore")}

--
Fabulka · https://fabulka.com
