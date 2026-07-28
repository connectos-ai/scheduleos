#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const markdownFiles = [];
const failures = [];

walk(root);

for (const filePath of markdownFiles) {
  checkMarkdownFile(filePath);
}

if (failures.length > 0) {
  console.error("Documentation link check failed:");
  for (const failure of failures) {
    console.error(`- ${path.relative(root, failure.file)}:${failure.line}: ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Documentation link check passed for ${markdownFiles.length} Markdown files.`);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(path.join(directory, entry.name));
      }
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      markdownFiles.push(path.join(directory, entry.name));
    }
  }
}

function checkMarkdownFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const anchors = collectAnchors(text);
  const links = collectLinks(text);

  for (const link of links) {
    const target = link.target.trim();
    if (shouldSkipTarget(target)) continue;

    const { targetPath, anchor } = splitTarget(target);
    const resolvedPath = resolveTargetPath(filePath, targetPath);
    if (!existsSync(resolvedPath)) {
      failures.push({
        file: filePath,
        line: link.line,
        message: `Missing target '${target}'.`
      });
      continue;
    }

    if (anchor && isMarkdownTarget(resolvedPath)) {
      const targetText = readFileSync(resolvedPath, "utf8");
      const targetAnchors = resolvedPath === filePath ? anchors : collectAnchors(targetText);
      if (!targetAnchors.has(anchor)) {
        failures.push({
          file: filePath,
          line: link.line,
          message: `Missing anchor '#${anchor}' in '${targetPath || path.basename(filePath)}'.`
        });
      }
    }
  }
}

function collectLinks(text) {
  const links = [];
  const inlineLinkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const referenceDefinitionPattern = /^\s*\[[^\]]+\]:\s+(\S+)/gm;

  for (const match of text.matchAll(inlineLinkPattern)) {
    if (!match[1]) continue;
    links.push({ target: match[1], line: lineNumberAt(text, match.index ?? 0) });
  }
  for (const match of text.matchAll(referenceDefinitionPattern)) {
    if (!match[1]) continue;
    links.push({ target: match[1], line: lineNumberAt(text, match.index ?? 0) });
  }

  return links;
}

function collectAnchors(text) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match?.[2]) continue;
    const base = slugifyHeading(match[2]);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

function slugifyHeading(heading) {
  return heading
    .replace(/<[^>]+>/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function shouldSkipTarget(target) {
  return (
    target.length === 0 ||
    target.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  );
}

function splitTarget(target) {
  const hashIndex = target.indexOf("#");
  if (hashIndex === -1) {
    return { targetPath: target, anchor: "" };
  }
  return {
    targetPath: target.slice(0, hashIndex),
    anchor: decodeTarget(target.slice(hashIndex + 1))
  };
}

function resolveTargetPath(sourceFile, targetPath) {
  const decodedPath = decodeTarget(targetPath);
  if (decodedPath.length === 0) return sourceFile;
  return path.resolve(path.dirname(sourceFile), decodedPath);
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function isMarkdownTarget(targetPath) {
  if (!existsSync(targetPath)) return false;
  const stat = statSync(targetPath);
  return stat.isFile() && targetPath.endsWith(".md");
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let position = 0; position < index; position += 1) {
    if (text.charCodeAt(position) === 10) line += 1;
  }
  return line;
}

if (process.argv[1] !== fileURLToPath(import.meta.url)) {
  throw new Error("check-doc-links.mjs must be executed directly.");
}
