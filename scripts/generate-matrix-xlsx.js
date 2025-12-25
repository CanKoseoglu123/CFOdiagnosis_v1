// Generate Excel matrix from content files
// Uses only data available in content/*.json and schemas

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load content files
const contentDir = path.join(__dirname, '..', 'content');
const questions = JSON.parse(fs.readFileSync(path.join(contentDir, 'questions.json'), 'utf8')).questions;
const practices = JSON.parse(fs.readFileSync(path.join(contentDir, 'practices.json'), 'utf8')).practices;
const initiatives = JSON.parse(fs.readFileSync(path.join(contentDir, 'initiatives.json'), 'utf8')).initiatives;
const objectives = JSON.parse(fs.readFileSync(path.join(contentDir, 'objectives.json'), 'utf8')).objectives;

// Theme config (from schemas.ts)
const THEMES = {
  foundation: { label: "The Foundation", description: "Build the basics: budgeting, controls, reporting" },
  future: { label: "The Future", description: "See what's coming: forecasting, visibility" },
  intelligence: { label: "The Intelligence", description: "Drive decisions: strategic influence, analytics" }
};

// Create lookup maps
const objectiveMap = new Map(objectives.map(o => [o.id, o]));
const questionMap = new Map(questions.map(q => [q.id, q]));
const initiativeMap = new Map(initiatives.map(i => [i.id, i]));

// Build practice to questions map
const practiceQuestionMap = new Map();
practices.forEach(p => {
  practiceQuestionMap.set(p.id, p.question_ids);
});

// ========== TAB 1: Theme → Objective → Practice → Question ==========
const tab1Data = [];

// Header row
tab1Data.push([
  'Theme ID',
  'Theme Label',
  'Theme Description',
  'Objective ID',
  'Objective Name',
  'Objective Description',
  'Objective Level',
  'Green Threshold',
  'Yellow Threshold',
  'Practice ID',
  'Practice Name',
  'Practice Short Name',
  'Practice Level',
  'Question ID',
  'Question Text',
  'Question Help',
  'Maturity Level',
  'Is Critical',
  'Impact',
  'Complexity',
  'Initiative ID',
  'Expert Action Title',
  'Expert Action Recommendation',
  'Expert Action Type'
]);

// For each theme
Object.entries(THEMES).forEach(([themeId, themeInfo]) => {
  // Get objectives for this theme
  const themeObjectives = objectives.filter(o => o.theme_id === themeId);

  themeObjectives.forEach(obj => {
    // Get practices for this objective's level
    const objPractices = practices.filter(p => p.level === obj.level);

    objPractices.forEach(practice => {
      // Get questions for this practice
      const practiceQuestions = practice.question_ids
        .map(qid => questionMap.get(qid))
        .filter(q => q && q.objective_id === obj.id);

      if (practiceQuestions.length === 0) {
        // Practice exists but no questions for this objective
        // Skip or add empty row
      } else {
        practiceQuestions.forEach(q => {
          tab1Data.push([
            themeId,
            themeInfo.label,
            themeInfo.description,
            obj.id,
            obj.name,
            obj.description,
            obj.level,
            obj.thresholds.green,
            obj.thresholds.yellow,
            practice.id,
            practice.name,
            practice.short_name,
            practice.level,
            q.id,
            q.text,
            q.help,
            q.maturity_level,
            q.is_critical ? 'Yes' : 'No',
            q.impact,
            q.complexity,
            q.initiative_id,
            q.expert_action.title,
            q.expert_action.recommendation,
            q.expert_action.type
          ]);
        });
      }
    });
  });
});

// Also add questions that may not be in the theme-objective-practice hierarchy
// (complete list organized by question)
const tab1Complete = [];
tab1Complete.push([
  'Question ID',
  'Question Text',
  'Question Help',
  'Maturity Level',
  'Is Critical',
  'Impact',
  'Complexity',
  'Objective ID',
  'Objective Name',
  'Objective Level',
  'Theme ID',
  'Theme Label',
  'Initiative ID',
  'Initiative Title',
  'Practice ID(s)',
  'Practice Name(s)',
  'Expert Action Title',
  'Expert Action Recommendation',
  'Expert Action Type'
]);

questions.forEach(q => {
  const obj = objectiveMap.get(q.objective_id);
  const init = initiativeMap.get(q.initiative_id);
  const theme = obj ? THEMES[obj.theme_id] : null;

  // Find which practice(s) this question belongs to
  const questionPractices = practices.filter(p => p.question_ids.includes(q.id));

  tab1Complete.push([
    q.id,
    q.text,
    q.help,
    q.maturity_level,
    q.is_critical ? 'Yes' : 'No',
    q.impact,
    q.complexity,
    q.objective_id,
    obj ? obj.name : '',
    obj ? obj.level : '',
    obj ? obj.theme_id : '',
    theme ? theme.label : '',
    q.initiative_id,
    init ? init.title : '',
    questionPractices.map(p => p.id).join(', '),
    questionPractices.map(p => p.name).join(', '),
    q.expert_action.title,
    q.expert_action.recommendation,
    q.expert_action.type
  ]);
});

// ========== TAB 2: Initiative → Practice Matrix ==========
const tab2Data = [];

// Header row
tab2Data.push([
  'Initiative ID',
  'Initiative Title',
  'Initiative Description',
  'Theme ID',
  'Theme Label',
  'Objective ID',
  'Objective Name',
  'Related Practice ID(s)',
  'Related Practice Name(s)',
  'Question Count'
]);

initiatives.forEach(init => {
  const obj = objectiveMap.get(init.objective_id);
  const theme = THEMES[init.theme_id];

  // Find questions that belong to this initiative
  const initQuestions = questions.filter(q => q.initiative_id === init.id);

  // Find practices that contain these questions
  const relatedPractices = practices.filter(p =>
    p.question_ids.some(qid => initQuestions.some(q => q.id === qid))
  );

  tab2Data.push([
    init.id,
    init.title,
    init.description,
    init.theme_id,
    theme ? theme.label : '',
    init.objective_id,
    obj ? obj.name : '',
    relatedPractices.map(p => p.id).join(', '),
    relatedPractices.map(p => p.name).join(', '),
    initQuestions.length
  ]);
});

// ========== Create Workbook ==========
const wb = XLSX.utils.book_new();

// Tab 1: Full Question Matrix
const ws1 = XLSX.utils.aoa_to_sheet(tab1Complete);
// Set column widths
ws1['!cols'] = [
  { wch: 12 },  // Question ID
  { wch: 80 },  // Question Text
  { wch: 50 },  // Help
  { wch: 8 },   // Level
  { wch: 10 },  // Critical
  { wch: 8 },   // Impact
  { wch: 10 },  // Complexity
  { wch: 18 },  // Objective ID
  { wch: 20 },  // Objective Name
  { wch: 8 },   // Obj Level
  { wch: 12 },  // Theme ID
  { wch: 18 },  // Theme Label
  { wch: 25 },  // Initiative ID
  { wch: 30 },  // Initiative Title
  { wch: 40 },  // Practice IDs
  { wch: 50 },  // Practice Names
  { wch: 35 },  // Expert Title
  { wch: 80 },  // Expert Rec
  { wch: 12 }   // Expert Type
];
XLSX.utils.book_append_sheet(wb, ws1, 'Questions-Full Matrix');

// Tab 2: Initiatives → Practices
const ws2 = XLSX.utils.aoa_to_sheet(tab2Data);
ws2['!cols'] = [
  { wch: 25 },  // Initiative ID
  { wch: 35 },  // Title
  { wch: 100 }, // Description
  { wch: 12 },  // Theme ID
  { wch: 18 },  // Theme Label
  { wch: 18 },  // Objective ID
  { wch: 22 },  // Objective Name
  { wch: 60 },  // Practice IDs
  { wch: 80 },  // Practice Names
  { wch: 12 }   // Question Count
];
XLSX.utils.book_append_sheet(wb, ws2, 'Initiatives-Practices');

// Write file
const outputPath = path.join(__dirname, '..', 'CFO_Diagnostic_Matrix.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('Excel file created:', outputPath);
console.log('Tab 1: Questions-Full Matrix -', tab1Complete.length - 1, 'questions');
console.log('Tab 2: Initiatives-Practices -', tab2Data.length - 1, 'initiatives');
