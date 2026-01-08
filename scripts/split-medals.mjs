import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const medalsData = JSON.parse(
  readFileSync(new URL('../src/data/medals.json', import.meta.url), 'utf-8')
)

const byType = {}

for (const medal of medalsData.medals) {
  if (!byType[medal.type]) {
    byType[medal.type] = []
  }
  byType[medal.type].push(medal)
}

for (const [type, medals] of Object.entries(byType)) {
  const output = {
    type,
    medals
  }

  const filename = join(
    new URL('../src/data', import.meta.url).pathname,
    `${type}.medals.json`
  )

  writeFileSync(filename, JSON.stringify(output, null, 2) + '\n', 'utf-8')
  console.log(`Created ${type}.medals.json (${medals.length} medals)`)
}

console.log(`\nSplit complete: ${Object.keys(byType).length} files created`)
