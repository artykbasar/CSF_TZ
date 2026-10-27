const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const compilerPath = process.env.VUE_COMPILER_SFC ||
    "/home/frappe/frappe-bench/apps/frappe/node_modules/@vue/compiler-sfc";
const { parse, compileScript, compileTemplate } = require(compilerPath);
const root = path.resolve(__dirname, "../csf_tz/public/js/jobcards");

for (const name of ["JobCards.vue", "Card.vue"]) {
    const filename = path.join(root, name);
    const source = fs.readFileSync(filename, "utf8");
    const parsed = parse(source, { filename });
    assert.deepEqual(parsed.errors, [], name + " parse");
    const script = compileScript(parsed.descriptor, { id: name });
    assert.ok(script.content, name + " script");
    const template = compileTemplate({
        source: parsed.descriptor.template.content,
        filename,
        id: name,
    });
    assert.deepEqual(template.errors, [], name + " template");
    console.log("PASS Vue 3 SFC:", name);
}
