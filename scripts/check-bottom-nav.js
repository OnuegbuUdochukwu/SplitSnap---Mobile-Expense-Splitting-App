#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Rule: bottom navigation must contain exactly these four tabs in this order
// and with the specified titles and icon components
const REQUIRED = [
  { name: 'index', title: 'Home', icon: 'Home' },
  { name: 'groups', title: 'Groups', icon: 'Users' },
  { name: 'activity', title: 'Activity', icon: 'Activity' },
  { name: 'profile', title: 'Profile', icon: 'User' },
];

function fail(msg) {
  console.error('bottom_navigation_integrity FAILED:', msg);
  process.exit(2);
}

function main() {
  const layoutPath = path.join(__dirname, '..', 'app', '(tabs)', '_layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    fail(`Layout file not found at ${layoutPath}`);
  }

  const src = fs.readFileSync(layoutPath, 'utf8');

  // Simple parse: look for <Tabs.Screen ... /> tags
  const tagRegex = /<Tabs\.Screen[\s\S]*?\/>/g;
  const nameRegex = /name\s*=\s*"([^"]+)"/;
  const optionsRegex = /options\s*=\s*\{\{([\s\S]*?)\}\}/;
  const titleRegex = /title\s*:\s*['"]([^'"]+)['"]/;
  const iconComponentRegex =
    /<\s*([A-Za-z0-9_]+)\s+[^>]*?(?:size|color)\s*=\s*\{/;

  const tags = src.match(tagRegex) || [];
  const found = [];

  for (const tag of tags) {
    const nameMatch = tag.match(nameRegex);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const optionsMatch = tag.match(optionsRegex);
    let title = null;
    let icon = null;
    // Robust: search the whole tag for title and icon patterns so nested braces
    // inside the options object don't break parsing.
    const titleMatch = tag.match(/title\s*:\s*['"]([^'"]+)['"]/);
    if (titleMatch) title = titleMatch[1];
    const iconMatch = tag.match(/<\s*([A-Za-z0-9_]+)\s+[^>]*size\s*=\s*\{/);
    if (iconMatch) icon = iconMatch[1];
    found.push({ name, title, icon });
  }

  if (found.length !== REQUIRED.length) {
    fail(
      `Found ${found.length} tab screens (expected ${
        REQUIRED.length
      }). Screens: ${found.map((f) => f.name).join(', ')}`
    );
  }

  for (let i = 0; i < REQUIRED.length; i++) {
    const exp = REQUIRED[i];
    const act = found[i];
    if (!act) {
      fail(`Missing tab at position ${i + 1}: expected '${exp.name}'`);
    }
    if (act.name !== exp.name) {
      fail(
        `Tab at position ${i + 1} is '${act.name}' but must be '${exp.name}'`
      );
    }
    if (act.title !== exp.title) {
      fail(
        `Tab '${exp.name}' title is '${
          act.title || 'undefined'
        }' but must be '${exp.title}'`
      );
    }
    if (act.icon !== exp.icon) {
      fail(
        `Tab '${exp.name}' icon component is '${
          act.icon || 'undefined'
        }' but must be '${exp.icon}'`
      );
    }
  }

  console.log(
    'bottom_navigation_integrity PASSED — tabs are present and ordered correctly'
  );
  process.exit(0);
}

main();
