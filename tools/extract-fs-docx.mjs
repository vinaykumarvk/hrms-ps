/**
 * Extract the text of the FS/BRD .docx deliverables so the full-coverage waves can be built
 * against the specification instead of against screen names.
 *
 * Why this exists: W1's Gap A inferred ten tables from prototype screens because the FS bodies
 * were treated as unreadable binaries. They are not — a .docx is a ZIP holding word/document.xml,
 * which the standard library can open. That mistake cost a wave's worth of inferred schema, so
 * the extractor is committed rather than run ad hoc.
 *
 * Output: docs/spec/full-coverage/fs-text/<name>.txt, gitignored-free plain text, one paragraph
 * per line. Tables render as tab-separated cells so field lists stay legible.
 *
 *   node tools/extract-fs-docx.mjs            # extract everything not already extracted
 *   node tools/extract-fs-docx.mjs --force    # re-extract
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { execFileSync } from "node:child_process";

const SOURCE_DIR = "docs/HRMS Deliverables to Development Phase";
const OUT_DIR = "docs/spec/full-coverage/fs-text";
const force = process.argv.includes("--force");

/** Read one entry out of a ZIP without pulling in a dependency. */
function readZipEntry(zipPath, entry) {
  // `unzip -p` streams a single member to stdout; every target platform for this repo has it.
  return execFileSync("unzip", ["-p", zipPath, entry], { maxBuffer: 64 * 1024 * 1024 });
}

function docxToText(zipPath) {
  const xml = readZipEntry(zipPath, "word/document.xml").toString("utf8");
  return (
    xml
      // table cell / row boundaries first, so a field table stays readable
      .replace(/<\/w:tc>/g, "\t")
      .replace(/<\/w:tr>/g, "\n")
      // paragraph and explicit line breaks
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:br\s*\/>/g, "\n")
      // drop every remaining tag
      .replace(/<[^>]+>/g, "")
      // XML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // tidy
      .replace(/\t+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

mkdirSync(OUT_DIR, { recursive: true });

const docs = readdirSync(SOURCE_DIR).filter((f) => extname(f).toLowerCase() === ".docx" && !f.startsWith("~$"));
let written = 0;
let skipped = 0;
const failures = [];

for (const doc of docs) {
  const out = join(OUT_DIR, `${basename(doc, ".docx").replace(/\s+/g, "_")}.txt`);
  if (existsSync(out) && !force) {
    skipped += 1;
    continue;
  }
  try {
    const text = docxToText(join(SOURCE_DIR, doc));
    writeFileSync(out, text, "utf8");
    written += 1;
    process.stdout.write(`  extracted ${String(text.length).padStart(7)} chars  ${doc}\n`);
  } catch (error) {
    failures.push({ doc, message: error instanceof Error ? error.message : String(error) });
  }
}

process.stdout.write(`\n${written} extracted, ${skipped} already present, ${failures.length} failed\n`);
for (const failure of failures) process.stdout.write(`  FAILED ${failure.doc}: ${failure.message}\n`);
if (failures.length > 0) process.exitCode = 1;
