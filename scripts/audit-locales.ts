#!/usr/bin/env bun
/**
 * Locale Audit Tool
 * Compares all locale directories against the reference locale (en-US)
 * to identify missing files and missing translation keys.
 *
 * Usage: bun run scripts/audit-locales.ts [--fix] [--json] [--spot-check]
 *
 * Options:
 *   --fix         Output suggestions for missing keys (does not auto-fix)
 *   --json        Output results as JSON instead of formatted table
 *   --spot-check  Show 5 random keys across 3 random languages for consistency review
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const LOCALES_DIR = join(import.meta.dir, '../nodes/locales');
const REFERENCE_LOCALE = 'en-US';

interface KeyPath {
  path: string;
  value: string;
}

interface LocaleAudit {
  locale: string;
  missingFiles: string[];
  extraFiles: string[];
  fileAudits: FileAudit[];
  missingHtmlFiles: string[];
  presentHtmlFiles: string[];
}

interface FileAudit {
  file: string;
  missingKeys: string[];
  extraKeys: string[];
  totalRefKeys: number;
  totalLocaleKeys: number;
  coverage: number;
}

interface AuditSummary {
  referenceLocale: string;
  referenceFiles: string[];
  referenceHtmlFiles: string[];
  totalReferenceKeys: number;
  locales: LocaleAudit[];
  timestamp: string;
}

/**
 * Recursively extract all keys from a nested object as dot-notation paths
 */
function extractKeys(obj: unknown, prefix = ''): KeyPath[] {
  const keys: KeyPath[] = [];

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...extractKeys(value, path));
      } else {
        keys.push({ path, value: String(value) });
      }
    }
  }

  return keys;
}

/**
 * Get value at a dot-notation path in an object
 */
function getValueAtPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Read and parse a JSON file, returning null if it doesn't exist or is invalid
 */
async function readJsonFile(filePath: string): Promise<unknown | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get all JSON files in a locale directory
 */
async function getLocaleFiles(localeDir: string): Promise<string[]> {
  try {
    const entries = await readdir(localeDir);
    return entries.filter(f => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
}

/**
 * Get all HTML files in a locale directory
 */
async function getHtmlFiles(localeDir: string): Promise<string[]> {
  try {
    const entries = await readdir(localeDir);
    return entries.filter(f => f.endsWith('.html')).sort();
  } catch {
    return [];
  }
}

/**
 * Get all locale directories
 */
async function getLocales(): Promise<string[]> {
  const entries = await readdir(LOCALES_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

/**
 * Audit a single locale against the reference
 */
async function auditLocale(
  locale: string,
  referenceFiles: string[],
  referenceData: Map<string, unknown>,
  referenceHtmlFiles: string[]
): Promise<LocaleAudit> {
  const localeDir = join(LOCALES_DIR, locale);
  const localeFiles = await getLocaleFiles(localeDir);
  const localeHtmlFiles = await getHtmlFiles(localeDir);

  const missingFiles = referenceFiles.filter(f => !localeFiles.includes(f));
  const extraFiles = localeFiles.filter(f => !referenceFiles.includes(f));

  const missingHtmlFiles = referenceHtmlFiles.filter(f => !localeHtmlFiles.includes(f));
  const presentHtmlFiles = localeHtmlFiles.filter(f => referenceHtmlFiles.includes(f));

  const fileAudits: FileAudit[] = [];

  for (const file of referenceFiles) {
    if (missingFiles.includes(file)) {
      // File is completely missing
      const refData = referenceData.get(file);
      const refKeys = refData ? extractKeys(refData) : [];
      fileAudits.push({
        file,
        missingKeys: refKeys.map(k => k.path),
        extraKeys: [],
        totalRefKeys: refKeys.length,
        totalLocaleKeys: 0,
        coverage: 0,
      });
      continue;
    }

    const refData = referenceData.get(file);
    const localeData = await readJsonFile(join(localeDir, file));

    if (!refData) continue;

    const refKeys = extractKeys(refData);
    const localeKeys = localeData ? extractKeys(localeData) : [];

    const refKeyPaths = new Set(refKeys.map(k => k.path));
    const localeKeyPaths = new Set(localeKeys.map(k => k.path));

    const missingKeys = [...refKeyPaths].filter(k => !localeKeyPaths.has(k));
    const extraKeys = [...localeKeyPaths].filter(k => !refKeyPaths.has(k));

    const coverage = refKeyPaths.size > 0
      ? ((refKeyPaths.size - missingKeys.length) / refKeyPaths.size) * 100
      : 100;

    fileAudits.push({
      file,
      missingKeys,
      extraKeys,
      totalRefKeys: refKeyPaths.size,
      totalLocaleKeys: localeKeyPaths.size,
      coverage,
    });
  }

  return {
    locale,
    missingFiles,
    extraFiles,
    fileAudits,
    missingHtmlFiles,
    presentHtmlFiles,
  };
}

/**
 * Format coverage percentage with color
 */
function formatCoverage(coverage: number): string {
  const pct = coverage.toFixed(1) + '%';
  if (coverage === 100) return `\x1b[32m${pct}\x1b[0m`; // Green
  if (coverage >= 90) return `\x1b[33m${pct}\x1b[0m`; // Yellow
  return `\x1b[31m${pct}\x1b[0m`; // Red
}

/**
 * Print a formatted table of results
 */
function printTable(summary: AuditSummary): void {
  const { locales, referenceFiles, referenceHtmlFiles, totalReferenceKeys } = summary;

  console.log('\n' + '='.repeat(80));
  console.log('LOCALE AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`Reference: ${REFERENCE_LOCALE}`);
  console.log(`Total JSON files: ${referenceFiles.length}`);
  console.log(`Total HTML files: ${referenceHtmlFiles.length}`);
  console.log(`Total keys: ${totalReferenceKeys}`);
  console.log(`Timestamp: ${summary.timestamp}`);
  console.log('='.repeat(80) + '\n');

  // Summary table
  console.log('JSON COVERAGE SUMMARY BY LOCALE');
  console.log('-'.repeat(80));
  console.log(
    'Locale'.padEnd(12) +
    'Files'.padEnd(8) +
    'Keys'.padEnd(10) +
    'Missing'.padEnd(10) +
    'Extra'.padEnd(8) +
    'Coverage'
  );
  console.log('-'.repeat(80));

  for (const locale of locales) {
    if (locale.locale === REFERENCE_LOCALE) continue;

    const totalMissing = locale.fileAudits.reduce((sum, f) => sum + f.missingKeys.length, 0);
    const totalExtra = locale.fileAudits.reduce((sum, f) => sum + f.extraKeys.length, 0);
    const totalKeys = locale.fileAudits.reduce((sum, f) => sum + f.totalLocaleKeys, 0);
    const avgCoverage = locale.fileAudits.length > 0
      ? locale.fileAudits.reduce((sum, f) => sum + f.coverage, 0) / locale.fileAudits.length
      : 0;

    const filesStatus = locale.missingFiles.length > 0
      ? `${referenceFiles.length - locale.missingFiles.length}/${referenceFiles.length}`
      : `${referenceFiles.length}/${referenceFiles.length}`;

    console.log(
      locale.locale.padEnd(12) +
      filesStatus.padEnd(8) +
      String(totalKeys).padEnd(10) +
      String(totalMissing).padEnd(10) +
      String(totalExtra).padEnd(8) +
      formatCoverage(avgCoverage)
    );
  }

  console.log('-'.repeat(80) + '\n');

  // HTML file coverage summary
  console.log('HTML HELP FILE COVERAGE BY LOCALE');
  console.log('-'.repeat(80));
  console.log(
    'Locale'.padEnd(12) +
    'Present'.padEnd(10) +
    'Missing'.padEnd(10) +
    'Coverage'
  );
  console.log('-'.repeat(80));

  for (const locale of locales) {
    if (locale.locale === REFERENCE_LOCALE) continue;

    const present = locale.presentHtmlFiles.length;
    const missing = locale.missingHtmlFiles.length;
    const total = referenceHtmlFiles.length;
    const coverage = total > 0 ? (present / total) * 100 : 100;

    console.log(
      locale.locale.padEnd(12) +
      `${present}/${total}`.padEnd(10) +
      String(missing).padEnd(10) +
      formatCoverage(coverage)
    );
  }

  console.log('-'.repeat(80) + '\n');

  // Detailed issues
  let hasIssues = false;

  for (const locale of locales) {
    if (locale.locale === REFERENCE_LOCALE) continue;

    const issues: string[] = [];

    if (locale.missingFiles.length > 0) {
      issues.push(`  Missing files: ${locale.missingFiles.join(', ')}`);
    }

    for (const fileAudit of locale.fileAudits) {
      if (fileAudit.missingKeys.length > 0) {
        issues.push(`  ${fileAudit.file}: missing ${fileAudit.missingKeys.length} keys`);
        for (const key of fileAudit.missingKeys.slice(0, 5)) {
          issues.push(`    - ${key}`);
        }
        if (fileAudit.missingKeys.length > 5) {
          issues.push(`    ... and ${fileAudit.missingKeys.length - 5} more`);
        }
      }
    }

    if (issues.length > 0) {
      if (!hasIssues) {
        console.log('ISSUES FOUND');
        console.log('-'.repeat(80));
        hasIssues = true;
      }
      console.log(`\n\x1b[1m${locale.locale}\x1b[0m`);
      for (const issue of issues) {
        console.log(issue);
      }
    }
  }

  if (!hasIssues) {
    console.log('\x1b[32m✓ All locales are complete!\x1b[0m\n');
  } else {
    console.log('\n' + '-'.repeat(80));
  }

  // File-by-file breakdown
  console.log('\nFILE COVERAGE MATRIX');
  console.log('-'.repeat(80));

  const localeNames = locales.filter(l => l.locale !== REFERENCE_LOCALE).map(l => l.locale);
  const header = 'File'.padEnd(25) + localeNames.map(l => l.padEnd(8)).join('');
  console.log(header);
  console.log('-'.repeat(80));

  for (const file of referenceFiles) {
    let row = file.replace('.json', '').padEnd(25);

    for (const locale of locales) {
      if (locale.locale === REFERENCE_LOCALE) continue;

      const fileAudit = locale.fileAudits.find(f => f.file === file);
      if (!fileAudit) {
        row += '\x1b[31m--\x1b[0m'.padEnd(8 + 9); // Account for ANSI codes
      } else if (fileAudit.coverage === 100) {
        row += '\x1b[32m✓\x1b[0m'.padEnd(8 + 9);
      } else {
        row += formatCoverage(fileAudit.coverage).padEnd(8 + 9);
      }
    }

    console.log(row);
  }

  console.log('-'.repeat(80) + '\n');
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Run spot check: show 5 random keys across 3 random languages
 */
async function runSpotCheck(
  locales: string[],
  referenceFiles: string[],
  referenceData: Map<string, unknown>
): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('SPOT CHECK - Random Translation Samples');
  console.log('='.repeat(80));

  // Collect all keys from all files
  const allKeys: { file: string; key: string }[] = [];
  for (const file of referenceFiles) {
    const data = referenceData.get(file);
    if (data) {
      const keys = extractKeys(data);
      for (const k of keys) {
        allKeys.push({ file, key: k.path });
      }
    }
  }

  // Select 5 random keys
  const selectedKeys = shuffle(allKeys).slice(0, 5);

  // Select 3 random non-reference locales
  const nonRefLocales = locales.filter(l => l !== REFERENCE_LOCALE);
  const selectedLocales = shuffle(nonRefLocales).slice(0, 3);

  console.log(`\nComparing ${selectedKeys.length} random keys across: ${REFERENCE_LOCALE}, ${selectedLocales.join(', ')}\n`);

  for (const { file, key } of selectedKeys) {
    console.log(`\x1b[1m${file} → ${key}\x1b[0m`);
    console.log('-'.repeat(60));

    // Show reference value
    const refData = referenceData.get(file);
    const refValue = refData ? getValueAtPath(refData, key) : undefined;
    console.log(`  \x1b[36m${REFERENCE_LOCALE.padEnd(8)}\x1b[0m ${JSON.stringify(refValue)}`);

    // Show values from selected locales
    for (const locale of selectedLocales) {
      const localeDir = join(LOCALES_DIR, locale);
      const localeData = await readJsonFile(join(localeDir, file));
      const localeValue = localeData ? getValueAtPath(localeData, key) : undefined;

      const status = localeValue === undefined
        ? '\x1b[31m(missing)\x1b[0m'
        : localeValue === refValue
          ? '\x1b[33m(same as ref)\x1b[0m'
          : '';

      console.log(`  ${locale.padEnd(8)} ${JSON.stringify(localeValue)} ${status}`);
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('Review the translations above for consistency and accuracy.');
  console.log('Run again for a different random sample.\n');
}

/**
 * Main audit function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const showFix = args.includes('--fix');
  const spotCheck = args.includes('--spot-check');

  console.log('Scanning locales directory...');

  // Get reference locale data
  const referenceDir = join(LOCALES_DIR, REFERENCE_LOCALE);
  const referenceFiles = await getLocaleFiles(referenceDir);

  if (referenceFiles.length === 0) {
    console.error(`Error: No JSON files found in reference locale ${REFERENCE_LOCALE}`);
    process.exit(1);
  }

  // Load all reference data
  const referenceData = new Map<string, unknown>();
  let totalReferenceKeys = 0;

  for (const file of referenceFiles) {
    const data = await readJsonFile(join(referenceDir, file));
    if (data) {
      referenceData.set(file, data);
      totalReferenceKeys += extractKeys(data).length;
    }
  }

  // Get reference HTML files
  const referenceHtmlFiles = await getHtmlFiles(referenceDir);

  // Get all locales and audit each
  const locales = await getLocales();
  const localeAudits: LocaleAudit[] = [];

  for (const locale of locales) {
    const audit = await auditLocale(locale, referenceFiles, referenceData, referenceHtmlFiles);
    localeAudits.push(audit);
  }

  const summary: AuditSummary = {
    referenceLocale: REFERENCE_LOCALE,
    referenceFiles,
    referenceHtmlFiles,
    totalReferenceKeys,
    locales: localeAudits,
    timestamp: new Date().toISOString(),
  };

  if (jsonOutput) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printTable(summary);

    if (showFix) {
      console.log('\nMISSING KEY DETAILS (--fix mode)');
      console.log('='.repeat(80));

      for (const locale of localeAudits) {
        if (locale.locale === REFERENCE_LOCALE) continue;

        for (const fileAudit of locale.fileAudits) {
          if (fileAudit.missingKeys.length === 0) continue;

          console.log(`\n\x1b[1m${locale.locale}/${fileAudit.file}\x1b[0m`);
          console.log('Missing keys with reference values:');

          const refData = referenceData.get(fileAudit.file);
          for (const key of fileAudit.missingKeys) {
            const value = getValueAtPath(refData, key);
            console.log(`  "${key}": ${JSON.stringify(value)}`);
          }
        }
      }
    }

    if (spotCheck) {
      await runSpotCheck(locales, referenceFiles, referenceData);
    }
  }

  // Exit with error code if there are missing translations
  const hasMissing = localeAudits.some(
    l => l.locale !== REFERENCE_LOCALE && (
      l.missingFiles.length > 0 ||
      l.fileAudits.some(f => f.missingKeys.length > 0)
    )
  );

  if (hasMissing) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
