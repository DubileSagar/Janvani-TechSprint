// Using global fetch available in Node.js v18+

// Polyfill fetch if needed (for older node versions in some environments)
// But we'll try native fetch first.

const ROOT_URL = "https://stategisportal.nic.in/dbt/rest/services/dbt/CSC_Admin/MapServer/1";
const CURRENT_LAYER_URL = "https://stategisportal.nic.in/dbt/rest/services/dbt/CSC_Admin/MapServer/1";

async function inspect() {
    console.log("Inspecting GIS Services...");

    // 1. List Services
    try {
        console.log(`\nFetching Services from ${ROOT_URL}?f=json ...`);
        const resp = await fetch(`${ROOT_URL}?f=json`);
        if (!resp.ok) throw new Error(resp.statusText);
        const data = await resp.json();
        console.log("Services:", JSON.stringify(data.services, null, 2));
        console.log("Folders:", JSON.stringify(data.folders, null, 2));
    } catch (e) {
        console.error("Failed to list services:", e.message);
    }

    // 2. Inspect Current Layer Fields
    try {
        console.log(`\nFetching Layer Details from ${CURRENT_LAYER_URL}?f=json ...`);
        const resp = await fetch(`${CURRENT_LAYER_URL}?f=json`);
        if (!resp.ok) throw new Error(resp.statusText);
        const data = await resp.json();

        console.log("Layer Name:", data.name);
        if (data.layers) {
            console.log("Layers:");
            data.layers.forEach(l => console.log(`- [${l.id}] ${l.name}`));
        } else if (data.fields) {
            console.log("Fields:");
            data.fields.forEach(f => console.log(`- ${f.name} (${f.type})`));
        } else {
            console.log("No fields or layers found. Data:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Failed to inspect layer:", e.message);
    }
}

inspect();
