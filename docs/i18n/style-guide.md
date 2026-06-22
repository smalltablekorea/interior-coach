# InteriorCoach — English Style Guide (UI & Marketing)

> Last updated: 2026-06-23
> Owner: i18n
> Audience: anyone writing English UI strings, marketing copy, docs, or in-app micro-copy for InteriorCoach.
> Scope: tone, voice, formatting, common mistakes.

---

## 1. Voice & Tone

### 1-1. We talk like a clear, capable colleague

- **Direct.** Say what we mean, in one sentence.
- **Conversational, not salesy.** Imagine explaining to a contractor over coffee.
- **Respect the reader's time.** Cut every word that doesn't earn its place.
- **No condescension, no jargon, no fake urgency.**

### 1-2. Voice across surfaces

| Surface | Voice |
|---|---|
| Product UI | Neutral, instructional. Active voice. Short. |
| Marketing landing | Confident, direct. Concrete benefit per sentence. |
| Help docs | Calm, step-by-step. Bullet-led. |
| Error states | Honest. No blame. Suggest a next step. |
| Empty states | Warm, instructional. Show the next action. |
| Email broadcasts | Conversational. One job per email. |

### 1-3. Tone calibration (with examples)

| Situation | ❌ Off-tone | ✅ On-tone |
|---|---|---|
| Loading | "Please be patient while we fetch your data…" | "Loading…" |
| Empty state | "It appears you have no projects in our system." | "No jobs yet. Add your first one to get started." |
| Success | "Congratulations! Your action was successfully completed!" | "Saved." |
| Error | "An error occurred. Please contact your administrator." | "Couldn't save — try again in a moment." |
| Confirmation | "Are you sure you want to proceed with this action?" | "Delete this job? You can't undo this." |
| CTA | "Click here to learn more about our amazing platform!" | "See how it works" |

---

## 2. Plain Language Rules

### 2-1. Replace these on sight

| ❌ | ✅ |
|---|---|
| utilize | use |
| in order to | to |
| at this point in time | now |
| due to the fact that | because |
| prior to | before |
| subsequent to | after |
| facilitate | help |
| leverage | use |
| enable (as filler) | (just say what it does) |
| implement | add / set up |
| stakeholder | (name the actual person) |
| best-in-class / world-class | (drop entirely) |
| solution / platform (as filler) | (drop entirely) |

### 2-2. Prefer concrete > abstract

- ❌ "Optimize your workflow." → ✅ "Set up a job in 2 minutes instead of 20."
- ❌ "Streamline your operations." → ✅ "Stop opening 6 tabs for one job."
- ❌ "Enhance productivity." → ✅ "Get 4 hours back per week."

### 2-3. Numbers and units

- Use numerals: "3 jobs", not "three jobs".
- Currency: `$49/mo` not `$49.00 per month`.
- Square footage: `1,000 sqft`, with comma for thousands.
- Time ranges: "9 AM – 5 PM" with en-dash.
- Always front-load the unit type: "14-day trial", not "trial of 14 days".

### 2-4. Sentence length

- UI strings: 1 sentence. Max 12 words for buttons, 20 for body.
- Marketing headlines: max 9 words.
- Marketing body paragraphs: max 3 sentences.
- Help docs: keep sentences under 25 words; break if longer.

---

## 3. Capitalization

### 3-1. Brand & product names

- **InteriorCoach** — always one word, camel case.
- **EstimateCoach** — same convention.
- **SpecBook** — same convention.
- **Smalltable / Smalltable Design Group** — one word, sentence case.

### 3-2. UI labels

- **Sentence case** everywhere except brand names and proper nouns.
  - ✅ "Add a job site"
  - ❌ "Add a Job Site"
  - ❌ "ADD A JOB SITE"
- **Buttons**: sentence case, verb first.
  - ✅ "Save changes", "Send selection link", "Add row"

### 3-3. Headlines

- Marketing H1/H2: **sentence case**.
  - ✅ "Run every job in one place."
  - ❌ "Run Every Job In One Place."

### 3-4. Proper nouns

- US states and cities: standard capitalization.
- Trade names that are proper nouns (brands): keep original ("Kohler", "Sherwin-Williams").

---

## 4. Punctuation

| Mark | Rule |
|---|---|
| Period | End every full-sentence UI string. Skip on isolated labels ("Email", "Name"). |
| Em dash (—) | Use for parenthetical asides. No spaces: `One word—not two.` (US convention.) |
| En dash (–) | Number ranges only: `9 AM – 5 PM`. |
| Hyphen (-) | Compound modifiers before noun: `14-day trial`, `job-level P&L`. |
| Oxford comma | Use it: "phases, schedule, and payments." |
| Exclamation | Avoid in UI. One per marketing page max. |
| Ellipsis (…) | Single character `…`, not three periods. Used for loading states. |
| Quotation marks | Curly (`"…"`), not straight (`"…"`). |
| Apostrophe | Curly (`'`), not straight (`'`). |

---

## 5. Common Korean → English Pitfalls

### 5-1. "사장님" — direct address

Korean copy heavily uses "사장님". In English UI, address the user directly as **"you"**.

- ❌ "Owners can manage jobs here."
- ✅ "Manage your jobs here."

In marketing copy about the user (third person), use **"contractor"** or **"interior contractor"**.

### 5-2. "한 번에 / 한 번이면 끝" — "one step"

The Korean phrase translates to "in one step" or "without re-entering". Avoid literal "one-time".

- ❌ "One-time project entry"
- ✅ "Enter once. We handle the rest."

### 5-3. "자동으로 깔립니다" — "auto-generated"

- ❌ "Will be automatically laid down for you"
- ✅ "Auto-generated"

### 5-4. "사장님이 조정 가능" — "You can adjust"

- ❌ "Adjustment by the owner is possible"
- ✅ "You can adjust any of this"

### 5-5. "현장" → context-sensitive

| Korean context | English |
|---|---|
| UI nav: "현장 관리" | "Job Sites" |
| Contract: "본 현장" | "this Project" |
| Marketing: "여러 현장을 굴리는 사장님" | "contractors running multiple jobs" |

### 5-6. Avoid "Welcome to InteriorCoach!" empty greetings

- ❌ "Welcome to InteriorCoach! We're excited to have you on board!"
- ✅ "Let's set up your first job."

---

## 6. Errors, Empty States, Loading

### 6-1. Error pattern

```
[What went wrong, plainly.] [What to try, if relevant.]
```

Examples:
- "Couldn't save — try again in a moment."
- "This client already exists. Open their profile to edit."
- "We can't reach Kakao right now. Use email login instead."

### 6-2. Empty state pattern

```
[Plain description of why it's empty.]
[One next step, with a button.]
```

Examples:
- "No jobs yet. Add your first one to get started." [+ Add Job button]
- "No clients in this stage. Move someone into 'In Consultation' to see them here."

### 6-3. Loading

- Standard: `Loading…`
- Long operation (>3s): `Setting up your first job — about 10 seconds…`

---

## 7. Accessibility

- Every button has a descriptive label, not just an icon.
  - ❌ `<button>×</button>`
  - ✅ `<button aria-label="Close">×</button>`
- Color is not the only signal. Status icons must have shape/text too.
- Form labels are visible (not placeholder-only).
- Plain language scores at or below US grade 9 reading level (use Hemingway editor).

---

## 8. Internationalization Mechanics

### 8-1. ICU pluralization

```jsonc
"jobsCount": "{count, plural, =0 {No jobs} one {1 job} other {# jobs}}"
```

### 8-2. Variables in strings

Use named variables, never positional:
- ✅ `"Welcome back, {name}."`
- ❌ `"Welcome back, {0}."`

### 8-3. Avoid string concatenation

Don't build sentences from fragments:
- ❌ `"You have " + n + " jobs in progress."` (breaks pluralization)
- ✅ Single ICU string with `{n, plural, …}`

### 8-4. Dates

- Use `next-intl`'s `format.dateTime()`.
- Default format for en-US: `Jan 5, 2026`.
- Default format for ko-KR: `2026.01.05`.

---

## 9. SEO Micro-Copy Rules

### 9-1. Meta title formula

```
[Primary keyword] — [Brand]
```

Max 60 characters. Examples:
- "Client Selections Software — InteriorCoach"
- "Pricing — InteriorCoach"

### 9-2. Meta description formula

```
[Action verb] [primary benefit] [secondary benefit]. [Brand] for [audience].
```

Max 155 characters. Example:
- "Run every job in one place. Selections, schedules, and payments included. InteriorCoach for small interior contractors."

### 9-3. URL slugs

- All lowercase.
- Hyphens, not underscores.
- No stop words: `/client-selections` not `/the-client-selections`.

---

## 10. Quality Bar (pre-merge checklist)

Before merging any English copy change:

- [ ] Brand name is "InteriorCoach" (not "Interior Coach", not "interior coach")
- [ ] No forbidden jargon (see glossary.md §10)
- [ ] Sentence case for buttons and headings
- [ ] Active voice
- [ ] Pluralization via ICU, not concatenation
- [ ] Variables named, not positional
- [ ] Period at end of full-sentence UI strings
- [ ] No straight quotes / straight apostrophes
- [ ] `i18n:check` passes
- [ ] Grade 9 reading level or below
- [ ] Glossary terms used consistently (cross-check with [glossary.md](glossary.md))
