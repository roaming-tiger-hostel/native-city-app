# Native City

Contest demo for a travel-character product. Long-term residents in Korea (not only the hostel host) train AI characters. Guests ask those characters. Characters do not pretend to be human.

House defaults: Nuri / Sori / Dal (operator-provided). Community examples: Maya (Muslim student food), Tom (anglophone resident), Yuki (Japanese resident lunch). Studio can create more.

## Layout

- `/guest` — character pick and chat list first, then ask. Desktop: chat on top, map below, context/decision on the right. Narrow: 심화 rises from the bottom covering the map.
- `/studio` — create a character, judgment harness, TourAPI place layer, Qwen key, per-character rubric/DB. Narrow: 이력 opens from the right, 심화 from the bottom.
- `/submit` — 기능설명서 and test accounts.

## Rules

- Taste never yields to search ratings. KTO OpenAPI may override facts (hours, coords, closed).
- Characters only claim coverage they were trained on.
- Do not clone the trainer. Characters are separate IP.

## Data

- Seed catalog in `src/lib/catalog.ts`.
- Live TourAPI: paste the key only in Studio → Places (never in chat/git). Stored in gitignored `.env.local`.
- Ranking in `src/lib/engine.ts`. Harness in `src/lib/train.ts`.
