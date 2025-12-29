/**
 * Extract all question IDs from the spec
 */

const questions = require('../content/questions.json');

const byLevel = {};

questions.questions.forEach(q => {
  const level = q.maturity_level;
  if (!byLevel[level]) byLevel[level] = [];
  byLevel[level].push(q.id);
});

console.log('Question IDs by level:\n');

Object.keys(byLevel).sort((a, b) => Number(a) - Number(b)).forEach(level => {
  console.log(`// L${level} questions (${byLevel[level].length})`);
  console.log('const L' + level + '_QUESTIONS = [');
  byLevel[level].forEach((id, i) => {
    const comma = i < byLevel[level].length - 1 ? ',' : '';
    console.log(`  '${id}'${comma}`);
  });
  console.log('];');
  console.log('');
});

console.log('Total questions:', questions.questions.length);
