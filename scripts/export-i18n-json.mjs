#!/usr/bin/env node
import fs from "fs";
import path from "path";

function extractObjectLiteral(source, marker) {
  const idx = source.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Marker not found: ${marker}`);
  }
  let i = idx + marker.length;
  while (i < source.length && source[i] !== "{") i += 1;
  if (source[i] !== "{") {
    throw new Error(`No object literal found for marker: ${marker}`);
  }
  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escaped = false;
  const start = i;
  for (; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === stringQuote) {
        inString = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      stringQuote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unclosed object literal for marker: ${marker}`);
}

function evalObject(literal, vars = {}) {
  const argNames = Object.keys(vars);
  const argValues = Object.values(vars);
  const fn = new Function(...argNames, `return (${literal});`);
  return fn(...argValues);
}

const root = process.cwd();
const i18nPath = path.join(root, "src", "lib", "i18n.ts");
const extraPath = path.join(root, "src", "lib", "i18n-extra.ts");
const outputDir = path.join(root, "src", "lib", "i18n", "messages");

const i18nSource = fs.readFileSync(i18nPath, "utf-8");
const extraSource = fs.readFileSync(extraPath, "utf-8");

const lnLiteral = extractObjectLiteral(extraSource, "export const messagesLn =");
const swLiteral = extractObjectLiteral(extraSource, "export const messagesSw =");
const messagesLiteral = extractObjectLiteral(i18nSource, "const messages =");

const messagesLn = evalObject(lnLiteral);
const messagesSw = evalObject(swLiteral);
const messages = evalObject(messagesLiteral, { messagesLn, messagesSw });

fs.mkdirSync(outputDir, { recursive: true });
for (const locale of ["fr", "en", "ln", "sw"]) {
  const outPath = path.join(outputDir, `${locale}.json`);
  fs.writeFileSync(outPath, JSON.stringify(messages[locale], null, 2), "utf-8");
  console.log(`✓ ${locale}.json`);
}

console.log("i18n JSON export completed.");
