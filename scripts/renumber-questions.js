const fs = require('fs');
const path = require('path');

// Paths
const questionsPath = path.join(__dirname, '..', 'content', 'questions.json');
const gatesPath = path.join(__dirname, '..', 'content', 'gates.json');

// Load data
const questionsData = JSON.parse(fs.readFileSync(questionsPath));
const gatesData = JSON.parse(fs.readFileSync(gatesPath));

// Build old→new ID mapping
const idMapping = {};
const questions = questionsData.questions;

questions.forEach((q, index) => {
  const newId = `fpa_q${String(index + 1).padStart(3, '0')}`;
  idMapping[q.id] = newId;
  q.id = newId;
});

// Update gates.json critical arrays
gatesData.critical_gates.l1_to_l2 = gatesData.critical_gates.l1_to_l2.map(oldId => {
  const newId = idMapping[oldId];
  if (!newId) {
    console.warn(`Warning: Gate ID ${oldId} not found in questions`);
    return oldId;
  }
  return newId;
});

gatesData.critical_gates.l2_to_l3 = gatesData.critical_gates.l2_to_l3.map(oldId => {
  const newId = idMapping[oldId];
  if (!newId) {
    console.warn(`Warning: Gate ID ${oldId} not found in questions`);
    return oldId;
  }
  return newId;
});

// Write updated files
fs.writeFileSync(questionsPath, JSON.stringify(questionsData, null, 2));
fs.writeFileSync(gatesPath, JSON.stringify(gatesData, null, 2));

// Output mapping for reference
console.log('Renumbered', questions.length, 'questions');
console.log('\nID Mapping (old → new):');
console.log('------------------------');

// Show critical gates mapping
console.log('\nCritical Gates L1→L2:');
['fpa_l1_q01', 'fpa_l1_q02', 'fpa_l1_q05', 'fpa_l1_q09'].forEach(oldId => {
  console.log(`  ${oldId} → ${idMapping[oldId]}`);
});

console.log('\nCritical Gates L2→L3:');
['fpa_l2_q01', 'fpa_l2_q02', 'fpa_l2_q06', 'fpa_l2_q08'].forEach(oldId => {
  console.log(`  ${oldId} → ${idMapping[oldId]}`);
});

// Save full mapping to file for reference
const mappingPath = path.join(__dirname, 'id-mapping.json');
fs.writeFileSync(mappingPath, JSON.stringify(idMapping, null, 2));
console.log('\nFull mapping saved to:', mappingPath);
