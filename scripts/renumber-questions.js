const fs = require('fs');
const path = require('path');

// Paths - questions are now split into three theme files
const contentDir = path.join(__dirname, '..', 'content');
const questionFiles = [
  'questions-foundation.json',
  'questions-future.json',
  'questions-intelligence.json'
];
const gatesPath = path.join(contentDir, 'gates.json');

// Load and merge questions from all three files
const allQuestions = [];
const questionFileData = {};
for (const fileName of questionFiles) {
  const filePath = path.join(contentDir, fileName);
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  questionFileData[fileName] = fileData;
  allQuestions.push(...fileData.questions);
}

const gatesData = JSON.parse(fs.readFileSync(gatesPath));

// Build old→new ID mapping
const idMapping = {};
const questions = allQuestions;

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

// Write updated files - update each theme file with its questions
for (const fileName of questionFiles) {
  const fileData = questionFileData[fileName];
  // Update questions in this file with new IDs
  fileData.questions = fileData.questions.map(q => {
    const newId = idMapping[q.id];
    if (newId) q.id = newId;
    return q;
  });
  fs.writeFileSync(path.join(contentDir, fileName), JSON.stringify(fileData, null, 2));
}
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
