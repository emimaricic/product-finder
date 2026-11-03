# AI usage

## Tools

- **Claude Code** (CLI agent, Claude Opus) was the main pair programmer. It handled scaffolding, implementation, tests, running the stack, and taking screenshots with a headless browser.
- **A design skill** (installed in Claude Code) gave the UI a structured design pass: it recorded product context (`PRODUCT.md`), wrote down a direction contract, and then ran a review step. That review was done by a separate agent with no access to the build conversation, judging only from screenshots.
- **My own reference projects** (a NestJS + Prisma backend and a React Native app) were the conventions the agent had to follow: module layout, `PrismaService`, throttling, the e2e test harness, and how API errors are handled.

## What I delegated and what I did myself

| Delegated to the agent | Kept for myself |
| --- | --- |
| Scaffolding, boilerplate, Prisma schema and migrations, DTOs, Angular components and SCSS | Reading the brief, finding what it doesn't say, setting scope and assumptions (DECISIONS.md) |
| Writing tests, then running them and the linters | Choosing the stack inside the constraints: one repo vs. two, Nest 11 vs. 12, the PrimeNG licence, a token-based theme instead of a second UI library; final say on the visual direction |
| Exploring the CSV for data-quality problems | Deciding how dirty data is handled (last duplicate wins, skip rows without a name, never delete products) |
| Bringing the stack up from scratch and checking it | Approving destructive steps: database resets (Prisma blocks AI-run resets without explicit consent, and I ran them myself) and deleting test data |
| Screenshot-based UI checks and fix rounds | Final review of the code and the documentation |

## Where I rejected, corrected or significantly changed the output

1. **The scaffold picked the wrong NestJS major.** `nest new` produced Nest 12, which is ESM-only and uses Vitest. Jest is a fixed constraint, and Jest's ESM mode is experimental and breaks with Prisma. We went back to **Nest 11 (CommonJS)**, matching my own backend. The brief only asks for the *latest* version of Angular, so that was allowed. Later `@nestjs/config@12` and `@nestjs/swagger@12` came in through `npm i` and broke the e2e tests ("Must use import to load ES Module"). Both were pinned back to the Nest 11 line.

2. **PrimeNG 22 is no longer MIT.** The first UI render showed a red "Invalid PrimeUI License" banner. The agent found that PrimeNG 22 (the only version that supports Angular 22) is under the commercial PrimeUI licence, while PrimeNG 21 is still MIT but needs Angular 21. It recommended going down to Angular 21. **I decided to stay on the latest stack** and registered a free Community key. The production licensing risk is written down as a decision to raise with the business, not hidden.

3. **I rejected the first UI as too plain, and then rejected the agent's alternatives.** The first version was a correct but generic shadcn-style zinc layout. I asked for a UI that has a "wow" effect and doesn't read as AI-generated. The design skill then offered several visual directions drawn from print artefacts (reagent labels, lexicons, newsprint catalogues, departure boards), and they all looked decades old. I rejected those as well and set the bar myself: Linear/Vercel, Raycast and Stripe, with light and dark themes. I also corrected my own earlier requirement. I had asked for shadcn, but what I actually wanted was its structured token system, which PrimeNG already has, so no second UI library was needed. The result is the "Precision Catalogue" direction: function-coloured glyphs, a function spectrum, keyboard navigation and a glyph morph between pages. An independent review agent then found further AI-default tells, and those were fixed: bevelled "avatar" glyphs, a landing-page hero inside a tool, labels that were dimmed below the contrast minimum, and a bare "—" with no meaning.

4. **I didn't accept "it scales" without proof.** The agent's first design claimed the indexes would handle 50k products. I asked for a benchmark that runs the real importer and queries at 50k. The first run showed search at **0.6–1 s**. Two causes came out of it, and both were fixed:
   - a search column without a trigram index forced a sequential scan, so a migration added the index;
   - autovacuum was still processing the bulk-loaded table, so the importer now vacuums after large changes.

   Search now runs at ~27 ms p50. Without the measurement both problems would have shipped.

5. **I rejected test data being shown as real reviews.** While testing the API, the agent created reviews ("Ana K.", "Bob") in my development database, and they then appeared in the UI as real customer reviews. The independent design review flagged this. We deleted them. Demo data now only exists in a throwaway verification stack, under a name that makes clear it is a fixture.

6. **Agent mistakes that tests and reviews caught, and that I made sure were fixed properly rather than suppressed:**
   - `ResourceRef.value()` **throws** in Angular 22 when the resource is in an error state, so a facets failure would have crashed the whole app shell. A component test caught it. The fix was a safe `hasValue()` accessor, not a try/catch.
   - The first draft of the import wrote a `lastImportedAt` timestamp to every product on every run. That is 50k writes a night for information the import log already has. I removed it.
   - The desktop filter column was sticky with its own scroll, which hid the Region and Certifications filters below the fold with no visual cue. Changed so it scrolls with the page.
   - The reviewer also caught several smaller problems: an invented "logo" square in the header (I had said no invented branding), amber stars that clashed with the amber Phase-out colour, and a mobile toolbar that overflowed at 360px. All were fixed and re-measured.

7. **I had the finished code reviewed by a second, independent agent, and it caught real defects.** The reviewer had no context from the build session and was told to hunt for bugs, not to praise. It found several features that didn't fully deliver what the docs claimed:
   - **The rate limit could be bypassed.** The API port was published, so a forged `X-Forwarded-For` header defeated the per-IP review limit. The API is now reachable only through nginx.
   - **Region counts were wrong.** They left out Global products, even though selecting a region includes them.
   - **"Best alternatives" were picked from an arbitrary sample of 50 candidates.** Ranking now runs in SQL over all of them, and a test proves the top result is the best possible match.
   - **A pending debounced search could pull the user back** from a product page they had just opened.
   - **The docs contradicted the code** in a few places.

   All of these are fixed and covered by tests. My takeaway: an agent's self-assessment is not a review.

## How I checked the agent's work

- I ran every claim. Unit and e2e tests ran against a real Postgres. The full `docker compose up --build` was run from an **empty database** as a separate compose project, which is exactly what a reviewer will do.
- Seed idempotency was checked twice: by tests and by hand (`created=199` the first time, `unchanged=199` the second, reviews still there).
- The UI was checked from screenshots at 1440px, 390px and 360px. A fresh review agent judged the result, and its fixes were scored before the work was accepted.

