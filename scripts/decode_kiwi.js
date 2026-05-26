// Decode the kiwi message into JSON. Usage: node scripts/decode_kiwi.js outdir/
// Requires: npm install kiwi-schema
const fs = require("fs");
const path = require("path");
const kiwi = require("kiwi-schema");
const dir = process.argv[2];
const schema = kiwi.decodeBinarySchema(fs.readFileSync(path.join(dir, "schema.bin")));
const compiled = kiwi.compileSchema(schema);
const doc = compiled.decodeMessage(fs.readFileSync(path.join(dir, "data.bin")));
fs.writeFileSync(path.join(dir, "doc.json"),
  JSON.stringify(doc, (k, v) => (typeof v === "bigint" ? v.toString() : v)));
console.log("nodeChanges:", doc.nodeChanges.length, "-> wrote doc.json");
// Helper: key(guid) = `${sessionID}:${localID}`; build parent->children from parentIndex.guid,
// sort children by parentIndex.position. Image fills: fillPaints[].image hash -> images/<hash>.
