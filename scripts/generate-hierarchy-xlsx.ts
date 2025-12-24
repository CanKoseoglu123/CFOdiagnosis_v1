/**
 * Generate comprehensive FPA Hierarchy XLSX
 * Single sheet with full scope of Pillar → Theme → Objective → Practice → Question
 */

import * as XLSX from 'xlsx';
import { SPEC } from '../src/specs/v2.7.0';
import { THEMES } from '../src/specs/types';
import { FPA_PRACTICES, LEVEL_NAMES } from '../src/specs/practices';

interface FlatRow {
  // Pillar
  pillar_id: string;
  pillar_name: string;
  pillar_description: string;
  pillar_weight: number;
  // Theme
  theme_code: string;
  theme_name: string;
  theme_display_name: string;
  theme_description: string;
  theme_order: number;
  // Objective
  objective_id: string;
  objective_name: string;
  objective_purpose: string;
  objective_description: string;
  objective_level: number;
  objective_level_label: string;
  objective_theme_order: number;
  objective_action_id: string;
  // Practice
  practice_id: string;
  practice_title: string;
  practice_description: string;
  practice_maturity_level: number;
  practice_level_name: string;
  practice_question_count: number;
  // Question
  question_id: string;
  question_text: string;
  question_help: string;
  question_level: number;
  question_level_label: string;
  question_weight: number;
  question_is_critical: string;
  question_impact: number | string;
  question_complexity: number | string;
  // Initiative
  initiative_id: string;
  initiative_title: string;
  initiative_description: string;
  // Expert Action
  expert_action_title: string;
  expert_action_recommendation: string;
  expert_action_type: string;
  // Maturity Gate
  maturity_gate_level: number | string;
  maturity_gate_label: string;
  maturity_gate_threshold: string;
}

function generateHierarchyData(): FlatRow[] {
  const rows: FlatRow[] = [];
  const pillar = SPEC.pillars[0];

  // Build lookup maps
  const themeMap = new Map(THEMES.map(t => [t.code, t]));
  const objectiveMap = new Map(SPEC.objectives.map(o => [o.id, o]));
  const initiativeMap = new Map((SPEC.initiatives || []).map(i => [i.id, i]));
  const gateMap = new Map(SPEC.maturityGates.map(g => [g.level, g]));

  // Build question to practice mapping
  const questionToPractice = new Map<string, typeof FPA_PRACTICES[0]>();
  for (const practice of FPA_PRACTICES) {
    for (const qid of practice.question_ids) {
      questionToPractice.set(qid, practice);
    }
  }

  // Process each question
  for (const question of SPEC.questions) {
    const objective = objectiveMap.get(question.objective_id || '');
    const theme = objective?.theme ? themeMap.get(objective.theme) : null;
    const practice = questionToPractice.get(question.id);
    const initiative = question.initiative_id ? initiativeMap.get(question.initiative_id) : null;
    const gate = gateMap.get(question.level || 0);

    const row: FlatRow = {
      // Pillar
      pillar_id: pillar.id,
      pillar_name: pillar.name,
      pillar_description: pillar.description || '',
      pillar_weight: pillar.weight,
      // Theme
      theme_code: theme?.code || '',
      theme_name: theme?.name || '',
      theme_display_name: theme?.displayName || '',
      theme_description: theme?.description || '',
      theme_order: theme?.order || 0,
      // Objective
      objective_id: objective?.id || '',
      objective_name: objective?.name || '',
      objective_purpose: objective?.purpose || '',
      objective_description: objective?.description || '',
      objective_level: objective?.level || 0,
      objective_level_label: LEVEL_NAMES[objective?.level || 0] || '',
      objective_theme_order: objective?.theme_order || 0,
      objective_action_id: objective?.action_id || '',
      // Practice
      practice_id: practice?.id || '',
      practice_title: practice?.title || '',
      practice_description: practice?.description || '',
      practice_maturity_level: practice?.maturity_level || 0,
      practice_level_name: LEVEL_NAMES[practice?.maturity_level || 0] || '',
      practice_question_count: practice?.question_ids.length || 0,
      // Question
      question_id: question.id,
      question_text: question.text,
      question_help: question.help || '',
      question_level: question.level || 0,
      question_level_label: question.levelLabel || '',
      question_weight: question.weight,
      question_is_critical: question.is_critical ? 'YES' : 'NO',
      question_impact: question.impact || '',
      question_complexity: question.complexity || '',
      // Initiative
      initiative_id: initiative?.id || '',
      initiative_title: initiative?.title || '',
      initiative_description: initiative?.description || '',
      // Expert Action
      expert_action_title: question.expert_action?.title || '',
      expert_action_recommendation: question.expert_action?.recommendation || '',
      expert_action_type: question.expert_action?.type || '',
      // Maturity Gate
      maturity_gate_level: gate?.level ?? '',
      maturity_gate_label: gate?.label || '',
      maturity_gate_threshold: gate?.threshold ? `${gate.threshold * 100}%` : ''
    };

    rows.push(row);
  }

  // Sort by theme_order, then by objective_theme_order, then by question level
  rows.sort((a, b) => {
    if (a.theme_order !== b.theme_order) return a.theme_order - b.theme_order;
    if (a.objective_theme_order !== b.objective_theme_order) return a.objective_theme_order - b.objective_theme_order;
    if (a.question_level !== b.question_level) return a.question_level - b.question_level;
    return a.question_id.localeCompare(b.question_id);
  });

  return rows;
}

function generateXLSX() {
  const rows = generateHierarchyData();

  // Define column headers (human-readable)
  const headers = [
    // Pillar
    'Pillar ID', 'Pillar Name', 'Pillar Description', 'Pillar Weight',
    // Theme
    'Theme Code', 'Theme Name', 'Theme Display Name', 'Theme Description', 'Theme Order',
    // Objective
    'Objective ID', 'Objective Name', 'Objective Purpose', 'Objective Description',
    'Objective Level', 'Objective Level Label', 'Objective Theme Order', 'Objective Action ID',
    // Practice
    'Practice ID', 'Practice Title', 'Practice Description',
    'Practice Maturity Level', 'Practice Level Name', 'Practice Question Count',
    // Question
    'Question ID', 'Question Text', 'Question Help',
    'Question Level', 'Question Level Label', 'Question Weight',
    'Is Critical', 'Impact (1-5)', 'Complexity (1-5)',
    // Initiative
    'Initiative ID', 'Initiative Title', 'Initiative Description',
    // Expert Action
    'Expert Action Title', 'Expert Action Recommendation', 'Expert Action Type',
    // Maturity Gate
    'Maturity Gate Level', 'Maturity Gate Label', 'Maturity Gate Threshold'
  ];

  // Convert rows to array of arrays
  const data = rows.map(row => [
    // Pillar
    row.pillar_id, row.pillar_name, row.pillar_description, row.pillar_weight,
    // Theme
    row.theme_code, row.theme_name, row.theme_display_name, row.theme_description, row.theme_order,
    // Objective
    row.objective_id, row.objective_name, row.objective_purpose, row.objective_description,
    row.objective_level, row.objective_level_label, row.objective_theme_order, row.objective_action_id,
    // Practice
    row.practice_id, row.practice_title, row.practice_description,
    row.practice_maturity_level, row.practice_level_name, row.practice_question_count,
    // Question
    row.question_id, row.question_text, row.question_help,
    row.question_level, row.question_level_label, row.question_weight,
    row.question_is_critical, row.question_impact, row.question_complexity,
    // Initiative
    row.initiative_id, row.initiative_title, row.initiative_description,
    // Expert Action
    row.expert_action_title, row.expert_action_recommendation, row.expert_action_type,
    // Maturity Gate
    row.maturity_gate_level, row.maturity_gate_label, row.maturity_gate_threshold
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  const colWidths = [
    { wch: 10 }, // Pillar ID
    { wch: 30 }, // Pillar Name
    { wch: 50 }, // Pillar Description
    { wch: 8 },  // Pillar Weight
    { wch: 12 }, // Theme Code
    { wch: 18 }, // Theme Name
    { wch: 30 }, // Theme Display Name
    { wch: 50 }, // Theme Description
    { wch: 8 },  // Theme Order
    { wch: 18 }, // Objective ID
    { wch: 22 }, // Objective Name
    { wch: 60 }, // Objective Purpose
    { wch: 50 }, // Objective Description
    { wch: 8 },  // Objective Level
    { wch: 15 }, // Objective Level Label
    { wch: 10 }, // Objective Theme Order
    { wch: 20 }, // Objective Action ID
    { wch: 22 }, // Practice ID
    { wch: 30 }, // Practice Title
    { wch: 60 }, // Practice Description
    { wch: 10 }, // Practice Maturity Level
    { wch: 15 }, // Practice Level Name
    { wch: 10 }, // Practice Question Count
    { wch: 12 }, // Question ID
    { wch: 80 }, // Question Text
    { wch: 50 }, // Question Help
    { wch: 8 },  // Question Level
    { wch: 12 }, // Question Level Label
    { wch: 8 },  // Question Weight
    { wch: 10 }, // Is Critical
    { wch: 10 }, // Impact
    { wch: 12 }, // Complexity
    { wch: 25 }, // Initiative ID
    { wch: 35 }, // Initiative Title
    { wch: 80 }, // Initiative Description
    { wch: 35 }, // Expert Action Title
    { wch: 100 }, // Expert Action Recommendation
    { wch: 15 }, // Expert Action Type
    { wch: 10 }, // Maturity Gate Level
    { wch: 12 }, // Maturity Gate Label
    { wch: 12 }, // Maturity Gate Threshold
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'FPA Hierarchy Full Scope');

  // Write file
  const outputPath = './FPA_Hierarchy_Full_Scope.xlsx';
  XLSX.writeFile(wb, outputPath);

  console.log(`✅ XLSX generated: ${outputPath}`);
  console.log(`📊 Total rows: ${rows.length} (48 questions)`);
  console.log(`📋 Columns: ${headers.length}`);

  // Summary stats
  const criticalCount = rows.filter(r => r.question_is_critical === 'YES').length;
  const byLevel = {
    L1: rows.filter(r => r.question_level === 1).length,
    L2: rows.filter(r => r.question_level === 2).length,
    L3: rows.filter(r => r.question_level === 3).length,
    L4: rows.filter(r => r.question_level === 4).length
  };
  const byTheme = {
    foundation: rows.filter(r => r.theme_code === 'foundation').length,
    future: rows.filter(r => r.theme_code === 'future').length,
    intelligence: rows.filter(r => r.theme_code === 'intelligence').length
  };

  console.log(`\n📈 Summary:`);
  console.log(`   Critical questions: ${criticalCount}`);
  console.log(`   By Level: L1=${byLevel.L1}, L2=${byLevel.L2}, L3=${byLevel.L3}, L4=${byLevel.L4}`);
  console.log(`   By Theme: Foundation=${byTheme.foundation}, Future=${byTheme.future}, Intelligence=${byTheme.intelligence}`);
}

generateXLSX();
