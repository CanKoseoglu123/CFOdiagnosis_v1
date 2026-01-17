# Blog Post Style Criteria

**Version:** 1.0  
**Last Updated:** 2026-01-17  
**Purpose:** Standard framework for writing and reviewing CFO Lens blog posts

---

## Overview

CFO Lens blog posts follow a "SecretCFO" style: sharp, peer-to-peer, rooted in real FP&A pressure moments. The goal is traffic through resonance—readers should feel "I've been in that room."

---

## File Structure & Images

### MDX Frontmatter Format

```yaml
---
slug: "your-url-slug"
title: "Your Blog Post Title"
excerpt: "Short description for cards and SEO"
date: "2025-01-17"
author: "CFO Lens Team"
readingTime: 5
featured: false
image: "/blog/your-hero-image.png"
tags: ["FP&A", "relevant", "tags"]
series: "FP&A Myths"
seriesOrder: 1
---
```

### Image Handling

**Location:** Images go in `cfo-frontend/public/blog/`

**Reference in MDX:**
```markdown
![Alt text](/blog/your-image.png)
```

**Hero Image:**
- Set in frontmatter: `image: "/blog/your-hero-image.png"`
- Also embed at top of post content for in-article display
- Use descriptive alt text for accessibility and SEO

**Naming Convention:**
- Use the slug as the base: `rolling-forecast-doesnt-roll.png`
- Keep lowercase, use hyphens, no spaces

**Image Requirements:**
- Hero images: 1200x630px recommended (social sharing friendly)
- In-article images: 800px wide minimum
- Format: PNG or WebP preferred
- Keep file size under 500KB

---

## Core Criteria

| # | Criterion | What We're Checking | Pass If... |
|---|-----------|---------------------|------------|
| 1 | **Pressure Moment Opening** | Post opens with a situation readers have lived | CEO question, board meeting tension, the silence after flagging a risk |
| 2 | **Voice: You/We** | Never "I"—avoids one-man-show feel | Uses "you" (reader) and "we" (finance community) throughout |
| 3 | **Plain Language** | No jargon, no complicated words | A non-native English speaker can understand every sentence |
| 4 | **Experience Anchors** | Reader recognizes their own situation | "You've been there," "Sound familiar?", "You know the dynamics" |
| 5 | **Pattern Recognition** | Shows the underlying pattern, not just symptoms | Explains *why* the gap persists, not just *what* is broken |
| 6 | **Headlines for Scanning** | 5-7 headlines break up the text | Reader can skim headlines and get the arc |
| 7 | **Hints, Not Playbooks** | Points toward the fix without giving full actions | Diagnosis framed as starting point, not prescription |
| 8 | **Single CTA** | One call-to-action at the end | Links to CFO Lens diagnostic with specific value proposition |
| 9 | **Reading Time** | 4-6 minutes (800-1200 words) | Long enough to build the case, short enough to finish |
| 10 | **Peer Tone** | Confident and direct, but earned through shared observation | Not preachy, not academic, not salesy |
| 11 | **No Preaching** | Trust the reader to draw conclusions | No "inspiring" summaries, no motivational statements, no clichés |
| 12 | **Real Blockers** | Name the actual barriers, not just the symptoms | Politics, culture, CEO backing—not just "process gaps" |

---

## Pressure Moments Library

Use these as opening anchors or weave throughout. Readers should feel "I've been in that room."

### Board & CEO Questions

| Pressure Moment | Related Myth |
|-----------------|--------------|
| "What does next year look like?" (and you don't have the forecast yet) | Rolling Forecast |
| "How much runway do we have?" (and you need a week to answer) | Cash Forecasting |
| "What happens if we lose our biggest customer?" (and you can't model it fast) | Scenarios |
| "Why did we miss?" (and the variance explanation says "timing") | Variance Analysis |
| "Can we afford this?" (and you're not sure because cash isn't modeled) | Cash Forecasting |
| "Is this deal good for us?" (and Finance wasn't consulted until now) | Finance Influence |

### Leadership Meeting Moments

| Pressure Moment | Related Myth |
|-----------------|--------------|
| Sales says $12.8M, Finance says $12.3M—meeting stalls | Data Alignment |
| Same variance shows up three months in a row, same explanation | Variance Analysis |
| Someone asks "who owns this budget line?" and nobody answers | Budget Accountability |
| A deal closed that Finance never reviewed—margin is terrible | Finance Influence |
| The forecast was off by 20% and nobody can explain why | Rolling Forecast / Bias |

### Internal Pressure

| Pressure Moment | Related Myth |
|-----------------|--------------|
| It's November and you're building next year's plan from scratch—again | Rolling Forecast |
| Budget owners say "Finance gave me that number" when they overspend | Budget Accountability |
| You spend 3 days building a scenario the CEO needed yesterday | Scenarios |
| The board deck is due and you're still reconciling data | Data Alignment |

### PE / Investor Pressure

| Pressure Moment | Related Myth |
|-----------------|--------------|
| "Walk me through your 13-week cash forecast" (and you don't have one) | Cash Forecasting |
| "What's your covenant headroom?" (and you check quarterly, not monthly) | Cash Forecasting |
| "Show me your downside scenario" (and it hasn't been updated since last year) | Scenarios / Contingency |

### The Silence Moments

| Pressure Moment | Related Myth |
|-----------------|--------------|
| You flag a risk, everyone nods, nothing changes | Finance Influence |
| You present the variance report, nobody asks questions—because nobody reads it | Variance Analysis |
| You raise concerns about a deal, it closes anyway, then fails as predicted | Finance Influence |

---

## Structure Template

```
1. PRESSURE MOMENT OPENING (1-2 paragraphs)
   - Start in the room: board meeting, CEO question, leadership tension
   - Reader should immediately think "I've been there"

2. THE PATTERN (2-3 sections with headlines)
   - Describe what actually happens vs. what teams claim
   - Use "you" language: "Here's what actually happens..."
   - Anchor to recognizable behaviors and dynamics

3. WHY IT MATTERS (1 section)
   - Connect to business impact: decisions made with half the picture
   - Show the cost of the gap

4. WHY IT DOESN'T GET FIXED (1 section)
   - Acknowledge the real blockers: time, politics, uncomfortable conversations
   - Show empathy—this isn't laziness, it's being stretched thin

5. WHERE TO START (1 short section)
   - Point to diagnosis as the starting point
   - Resist the urge to prescribe—hint at direction only

6. CTA (1 paragraph)
   - Single call-to-action linking to CFO Lens diagnostic
   - Specific to what the diagnostic reveals for this topic
```

---

## Language Guide

### Words to Use

| Instead of... | Use... |
|---------------|--------|
| Receding | Shrinking |
| Calibrate | Adjust |
| Stakeholders | The team / Leadership / The business |
| Leverage | Use |
| Optimize | Improve / Fix |
| Implement | Set up / Start |
| Utilize | Use |
| Facilitate | Help / Enable |
| Synergies | (don't use) |
| Alignment | Agreement / Same page |
| Cadence | Rhythm / Schedule |
| Bandwidth | Time / Capacity |

### Phrases That Work

- "You've been there."
- "Sound familiar?"
- "You know the dynamics."
- "Here's what actually happens."
- "Here's the thing:"
- "But here's the problem:"
- "None of this is news to you."
- "So why doesn't it get fixed?"

### Phrases to Avoid

- "Best practices" (sounds like consulting)
- "World-class" (meaningless)
- "Unlock value" (B2B buzzword)
- "Drive results" (vague)
- "Strategic alignment" (jargon)
- "Cross-functional synergies" (consultant-speak)
- "Transform your..." (oversells)

---

## CTA Templates

Each CTA should be specific to what the post covers. Examples:

| Post Topic | CTA |
|------------|-----|
| Rolling Forecast | "CFO Lens diagnoses your forecasting practices—not whether you have a forecast, but whether it gives you real forward visibility." |
| Variance Analysis | "CFO Lens assesses your performance monitoring practices—from threshold discipline to action tracking—and shows you exactly where the feedback loop breaks down." |
| Budget Accountability | "CFO Lens diagnoses your budget process across the practices that actually drive accountability—not just the ones that produce spreadsheets." |
| Finance Influence | "CFO Lens evaluates your strategic influence practices—from commercial partnership to board-level impact—and shows you exactly where Finance's voice gets lost." |
| Cash Forecasting | "CFO Lens evaluates your cash flow visibility across the practices that separate P&L forecasting from true liquidity management." |
| Data Alignment | "CFO Lens evaluates your financial controls and data governance practices—from chart of accounts to reconciliation discipline." |
| Scenarios | "CFO Lens evaluates your scenario modeling practices—from rapid what-if capability to multi-scenario maintenance." |
| Contingency | "CFO Lens assesses your scenario and stress-testing practices—including trigger documentation, breaking point analysis, and risk tracking." |

---

## Anti-Patterns

| Anti-Pattern | Example | Why It Fails |
|--------------|---------|--------------|
| **"I" voice** | "I've seen this pattern in dozens of companies" | Sounds like one-man-show; use "you" or "we" |
| **Listicle structure** | "Three Questions That Expose It: 1. 2. 3." | Feels formulaic; let questions emerge naturally |
| **Template headers** | "The Myth / The Reality / The Fix" | Too rigid; vary the structure |
| **Prescriptive actions** | "Step 1: Create a sign-off template..." | Gives away the playbook; hint instead |
| **Complicated words** | "Receding horizon," "calibrate assumptions" | Assumes native English; keep it simple |
| **Opening with thesis** | "Rolling forecasts are critical because..." | Boring; start with pressure moment |
| **Consultant tone** | "Best-in-class organizations leverage..." | Makes readers cringe; be peer, not guru |
| **Preaching** | "Wishes don't survive contact with reality" | CFO already knows this; don't lecture |
| **Motivational endings** | "Take the first step today toward transformation" | This isn't a TED talk; be direct |
| **Clichés** | "At the end of the day," "move the needle" | Lazy writing; find a fresher way |
| **Too-simple exercises** | "Pick 10 budget lines and check them" | Undermines peer positioning; too junior |
| **Surface-level blockers** | "The problem is lack of process" | Name the real blocker: politics, culture, power |
| **Bolted-on sections** | A related topic that doesn't flow naturally | Either integrate fully or save for another post |

### The Preaching Trap

Preaching happens when we tell readers what they already know, in a tone that implies they need to be told. CFOs don't need inspiration. They need clarity.

**Signs you're preaching:**
- Sentences that would work on a motivational poster
- Conclusions the reader could have drawn themselves
- "The goal is..." or "The point is..." followed by something obvious
- Any sentence that starts with "Remember that..."
- Rhetorical flourishes that add no information

**Instead:** Trust the reader. State the situation clearly. Let them draw the conclusion. If the insight is strong, you don't need to dress it up.

**Example:**

❌ *"The goal isn't to trap people. It's to make the budget real. A budget that nobody committed to is just Finance's wish for how the year will go. And wishes don't survive contact with reality."*

✓ *"The sign-off doesn't just document commitment. It creates it. And when someone overspends? The conversation changes. It's not 'Finance gave me that number.' It's 'You signed for this. What happened?'"*

The first version tells the reader what to think. The second shows them—and lets them feel the shift.

---

## Review Checklist

Before publishing, verify:

- [ ] Opens with a pressure moment readers have lived
- [ ] No "I" voice—only "you" and "we"
- [ ] All words passable for non-native English speakers
- [ ] At least 3 experience anchors ("you've been there," etc.)
- [ ] Explains why the gap persists, not just what's broken
- [ ] Names real blockers (politics, culture, power)—not just process gaps
- [ ] 5-7 headlines for scanning
- [ ] Hints at fix without giving full playbook
- [ ] Single CTA at the end, specific to the topic
- [ ] 800-1200 words (4-6 min read)
- [ ] Tone is peer-to-peer, not preachy or academic
- [ ] No motivational statements or clichés
- [ ] Conclusion trusts reader to draw their own takeaway
- [ ] Hero image set in frontmatter and embedded at top of content
- [ ] Image file exists in `cfo-frontend/public/blog/`
- [ ] Alt text is descriptive and meaningful

---

## Series: FP&A Myths

This style guide applies to the "FP&A Myths" series. Planned posts:

| # | Myth | Headline | Primary Pressure Moment |
|---|------|----------|------------------------|
| 1 | "We Have a Budget" | You Don't Have a Budget. You Have a Wishlist. | Budget owner says "Finance gave me that number" |
| 2 | "We Do Rolling Forecasts" | Your Rolling Forecast Doesn't Roll | Board asks "What does next year look like?" |
| 3 | "We Investigate Variances" | The Variance Explanation That Explains Nothing | Same variance, same explanation, three months running |
| 4 | "Finance Has a Seat" | Finance Stopped Saying No | Deal closes without review, margin is terrible |
| 5 | "We Forecast Cash" | Profit Is Not Cash | CEO asks "How much runway?" and it takes a week |
| 6 | "Our Data Is Aligned" | The Meeting Where Everyone Argues About Numbers | Sales says $12.8M, Finance says $12.3M |
| 7 | "We Have Scenarios" | You Have Scenarios. But Can You Build One in 48 Hours? | CEO needs a what-if by Wednesday |
| 8 | "We Have a Contingency Plan" | Your Contingency Plan Is Hope | Revenue drops 15%, three weeks of meetings to decide |

---

## Usage

Apply this framework when:

- Writing new blog posts for the FP&A Myths series
- Reviewing drafts before publication
- Briefing external writers or editors
- Ensuring consistency across content
