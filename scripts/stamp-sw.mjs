#!/usr/bin/env node
// Stamps public/sw.js with the current build timestamp so each deploy
// gets a unique cache name and old caches are purged on activate.

import { readFileSync, writeFileSync } from 'node:fs'

const SW_PATH = new URL('../public/sw.js', import.meta.url).pathname
const timestamp = Date.now().toString(36)

const content = readFileSync(SW_PATH, 'utf-8')
const stamped = content.replace('__BUILD_TS__', timestamp)

writeFileSync(SW_PATH, stamped, 'utf-8')
console.log(`sw.js stamped with build version: ${timestamp}`)
