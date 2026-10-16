# Audixa (Audit 360), folder layout for the Analytix build skills

```
<this folder>/
├── prototype/              the working prototype (read only: the visual and workflow reference)
├── project/                the real application is built here (React + TypeScript, FastAPI, SQLite)
├── HANDOVER_PROMPT.md      the prompt to give Claude Code first
├── PRD.md                  created by the skill analytix-prototype-to-prd
└── .prd_work/              created by the skill analytix-prototype-to-prd
```

Start here:

1. Open Claude Code in this folder and paste the prompt in `HANDOVER_PROMPT.md`.
2. The skills run in this order: `analytix-prototype-to-prd` (writes `PRD.md`, asks you what to add, ends when you say "approve the PRD"), then `analytix-prd-to-app`, `analytix-app-testing`, `analytix-fix-bugs`, `analytix-app-testing`. `analytix-recheck-prd` is only used after you edit `PRD.md` by hand.
3. API keys and passwords go into `project/backend/.env` by hand. Never paste them into the chat.

To look at the prototype: `cd prototype && npm install && npm run dev` (http://localhost:5173), then sign in through the demo picker. `prototype/README.md` describes it, and `prototype/docs/` holds the decisions file and the source documents (Rule Book, requirement lists, sampling files, open items).
