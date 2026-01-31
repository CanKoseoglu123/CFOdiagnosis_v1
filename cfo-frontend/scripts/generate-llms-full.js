// scripts/generate-llms-full.js
// Generates llms-full.txt from content JSON files for LLM consumption

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://cfodiagnosisv1.vercel.app';

function generateLlmsFull() {
  const contentDir = path.join(__dirname, '../../content');
  const blogDir = path.join(__dirname, '../content/blog');
  const publicDir = path.join(__dirname, '../public');

  // Read content JSON
  const objectives = JSON.parse(fs.readFileSync(path.join(contentDir, 'objectives.json'), 'utf-8'));
  const themes = JSON.parse(fs.readFileSync(path.join(contentDir, 'themes.json'), 'utf-8'));
  const practices = JSON.parse(fs.readFileSync(path.join(contentDir, 'practices.json'), 'utf-8'));

  // Read blog frontmatter
  const blogPosts = [];
  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
      const { data } = matter(content);
      if (data.slug) {
        blogPosts.push({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          date: data.date,
        });
      }
    }
    blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Group practices by objective
  const practicesByObjective = {};
  for (const p of practices) {
    if (!practicesByObjective[p.objective_id]) practicesByObjective[p.objective_id] = [];
    practicesByObjective[p.objective_id].push(p);
  }

  // Group objectives by theme
  const objectivesByTheme = {};
  for (const obj of objectives) {
    if (!objectivesByTheme[obj.theme_id]) objectivesByTheme[obj.theme_id] = [];
    objectivesByTheme[obj.theme_id].push(obj);
  }

  // Build markdown
  const sections = [];

  sections.push(`# CFO Lens AI — Full Reference

> AI-powered FP&A maturity diagnostic platform that compresses a 6-figure consulting engagement into hours. This is the extended reference for LLMs and AI assistants.

CFO Lens AI is a SaaS platform that helps CFOs and finance leaders assess the maturity of their Financial Planning & Analysis (FP&A) function. It delivers a structured, 97-question diagnostic across 9 strategic objectives grouped into 3 themes, provides maturity scoring with industry benchmarks, and generates prioritized action plans with executive-ready PDF reports.

## Scoring methodology

The scoring engine is fully deterministic. The formula is:

Score = (Impact squared / Complexity) multiplied by CriticalBoost multiplied by CombinedMultiplier

- AI explains results but never changes scores
- Missing answers receive a score of zero
- Critical gate failures cap maturity level regardless of raw score
- P1 blockers prevent "Green" status on any objective

### Maturity levels

| Level | Name | Threshold | Gate requirement |
|-------|------|-----------|------------------|
| 1 | Emerging | Below 40% | None |
| 2 | Defined | 40% or above | Pass Level 1 critical gates |
| 3 | Managed | 65% or above | Pass Level 1 and Level 2 critical gates |
| 4 | Optimized | 85% or above | Pass all critical gates |

### Calibration multipliers

| Calibration level | Multiplier |
|-------------------|------------|
| 5 Critical | 1.50x |
| 4 High | 1.25x |
| 3 Medium | 1.00x |
| 2 Low | 0.75x |
| 1 Minimal | 0.50x |

Context modifier (pain points): 1.0x base, multiplied by 1.5 per match, capped at 2.0x.
Combined multiplier cap: minimum of 2.0 and (ImportanceFactor multiplied by ContextModifier).`);

  // Themes and objectives
  sections.push(`## Diagnostic structure`);

  for (const theme of themes) {
    const themeObjectives = objectivesByTheme[theme.id] || [];
    sections.push(`### ${theme.label}

${theme.description}
`);

    for (const obj of themeObjectives) {
      const objPractices = practicesByObjective[obj.id] || [];
      const practiceList = objPractices.map(p => `  - ${p.title} (${p.capability_tags.join(', ')})`).join('\n');
      sections.push(`#### ${obj.title}

${obj.description}

Practices:
${practiceList}
`);
    }
  }

  // User journey
  sections.push(`## User journey

1. **Company profiling** — Industry, size, complexity factors establish the benchmark context
2. **Persona classification** — Identifies CFO archetype (e.g., Steward, Strategist, Catalyst, Operator) for context-aware target setting
3. **97-question diagnostic** — Binary yes/no questions across 9 objectives, organized by theme
4. **Calibration** — Adjusts maturity targets based on industry, company size, and transformation ambition
5. **Maturity results** — Scores per objective, gap analysis, critical gate status, benchmark comparison
6. **War Room** — Interactive action planning that converts diagnostic insights into a prioritized transformation roadmap
7. **Executive PDF report** — Board-ready document with scores, gaps, recommendations, and initiative groupings`);

  // FAQ
  sections.push(`## Frequently asked questions

**What is an FP&A maturity assessment?**
An FP&A maturity assessment evaluates how advanced your Financial Planning and Analysis function is across key capabilities like budgeting, forecasting, scenario modeling, and strategic influence. It identifies gaps between current state and best practice, providing a roadmap for improvement.

**How long does the diagnostic take?**
Most CFOs complete the full 97-question diagnostic in 60 to 90 minutes. The questions are binary (yes/no) and organized by objective, so progress is steady and transparent.

**How is this different from hiring a consultant?**
A traditional FP&A maturity assessment by a consulting firm costs six figures and takes months. CFO Lens delivers comparable diagnostic depth in hours at a fraction of the cost, using a deterministic scoring engine calibrated to your industry, size, and persona.

**What payment methods do you accept?**
All major credit cards via Stripe. EU customers can pay in EUR, others pay in USD.

**Can I try before I buy?**
Yes. The free tier gives you access to 2 objectives so you can experience the diagnostic before upgrading.

**What happens to my data if I cancel?**
Your diagnostic data is retained. You can still view your results but will not be able to access premium features or start new full assessments.`);

  // Blog posts
  if (blogPosts.length > 0) {
    const blogSection = blogPosts.map(p =>
      `- [${p.title}](${BASE_URL}/blog/${p.slug}): ${p.excerpt}`
    ).join('\n');

    sections.push(`## Blog posts

${blogSection}`);
  }

  // Links
  sections.push(`## Pages

- [Home](${BASE_URL}/): Landing page with platform overview
- [Platform](${BASE_URL}/platform): Feature details and methodology
- [About](${BASE_URL}/about): Team and mission
- [Pricing](${BASE_URL}/pricing): Free tier (2 objectives) and Pro tier (all 9 objectives)
- [Blog](${BASE_URL}/blog): Insights for finance leaders
- [LLM summary](${BASE_URL}/llms.txt): Concise version of this document`);

  const output = sections.join('\n\n');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), output);
  console.log(`\u2713 llms-full.txt generated (${output.length} chars)`);
}

generateLlmsFull();
