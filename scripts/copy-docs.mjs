#!/usr/bin/env node
/**
 * Script to copy documentation files to public folder for static serving
 */

import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const sourceDir = join(rootDir, "docs");
const targetDir = join(rootDir, "public", "docs");

console.log("📚 Copying documentation files...");

// Remove existing docs in public if exists
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true });
  console.log("  Removed existing public/docs");
}

// Create target directory
mkdirSync(targetDir, { recursive: true });

// Copy docs directory
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`✅ Documentation copied to ${targetDir}`);
