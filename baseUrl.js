form_url();

function form_url() {
    if (!pm.collectionVariables.has("baseHost")) {
        pm.collectionVariables.set("baseHost", "127.0.0.1");
    }

    let baseHost = pm.collectionVariables.get("baseHost");

    if (!pm.collectionVariables.has("basePort")) {
        pm.collectionVariables.set("basePort", "8080");
    }

    let basePort = pm.collectionVariables.get("basePort");

    if (!pm.collectionVariables.has("basePrefix")) {
        pm.collectionVariables.set("basePrefix", "");
    }

    let baseUrl = baseHost + ":" + basePort;
    pm.collectionVariables.set("baseUrl", baseUrl);

    console.info("Collection pre-request script. Formed baseUrl:", baseUrl);
}
