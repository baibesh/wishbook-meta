<#ftl output_format="plainText">
<#if user.firstName?has_content>${msg("fabulkaHelloName", user.firstName)}<#else>${msg("fabulkaHello")}</#if>

${msg("fabulkaVerifyText")}

${msg("fabulkaVerifyButton")}: ${link}

${msg("fabulkaLinkExpires", linkExpirationFormatter(linkExpiration))} ${msg("fabulkaVerifyIgnore")}

--
Fabulka · https://fabulka.com
