# AI usage

## Tools

**Claude Code** was my main tool. It wrote most of the code, tests and documentation, ran the stack and took screenshots. A design skill inside it structured the UI work. Separate review agents, with no access to the build conversation, reviewed the UI and the code. My own NestJS and React projects served as the conventions it had to follow.

## What I delegated and what I did

**Delegated:** scaffolding and implementation, tests, first analysis of the brief and the CSV, first proposals for the data model and the data-cleaning rules, and first drafts of the documents.

**Mine:** deciding what to accept. I chose the direction on the stack, the licence and the UI, reported bugs from using the app, questioned what I didn't understand, and ran the destructive database resets myself, because Prisma blocks those for AI agents.

## Where I rejected or corrected the output

1. **The first UI.** It was correct but looked like a generic AI dashboard, so I rejected it. The design skill then offered directions based on print artefacts (lexicons, reagent labels, departure boards), which looked decades old, so I rejected those too and set the bar myself: Linear/Vercel, Raycast and Stripe, with light and dark themes.

2. **The PrimeNG licence.** The first render showed an "Invalid PrimeUI License" banner, because PrimeNG 22 is no longer MIT. The agent recommended dropping to Angular 21 and PrimeNG 21. I overruled that, because the brief asks for the latest Angular, and registered a Community key. The agent then hardcoded the key in a source file. I questioned that, and it now comes from an environment variable, with a fallback so a fresh clone works.

3. **A bug I found by using it.** On mobile, product icons flashed over the filter sheet. The agent had enabled View Transitions for every navigation, including filter changes. They now run only between pages.

4. **The theme.** The agent shipped dark mode that only followed the OS. I wanted a manual switch, so it now has System, Light and Dark.

## How the agent's work was checked

I didn't want to rely on the agent saying the work was done, so I approved these checks:

- **Tests.** A component test caught that `ResourceRef.value()` throws in an error state, which would have crashed the whole app shell if facets failed. The e2e tests run on a real Postgres, and CI boots the full stack from an empty database.
- **A 50k benchmark.** The agent proposed it when I asked what would make the solution stand out. Its first run showed search at 0.6–1 s, despite the agent's earlier claim that the indexes were enough. A missing index and autovacuum were the causes. Search now takes about 9 ms.
- **Independent reviews.** A fresh agent reviewed the code and found defects the build agent had missed or described too generously:
  - the review rate limit could be bypassed with a forged `X-Forwarded-For` header;
  - region counts left out Global products;
  - "best alternatives" were picked from an arbitrary sample of 50;
  - a pending search could pull you back from a product page.

  A design review found test reviews displayed as real customers, an invented logo and a landing-page hero inside a tool. All of these were fixed.

My main lesson is that an agent's own summary is not a review. What helped most was evidence: a test, a measurement or a second pair of eyes.
