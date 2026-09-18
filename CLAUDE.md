# Native City

Contest demo for a host-trained travel-character product. One real person trains several AI characters; guests talk to those characters. Characters do not pretend to be human.

## Layout

- `/guest` — chat on top, map below, context/decision on the right (Tiger Upper Cut three-zone idea, guest-facing).
- `/studio` — judgment harness, TourAPI place layer, character rubrics.
- `/submit` — 기능설명서 and test accounts.

## Rules

- Taste never yields to search ratings. KTO OpenAPI may override facts (hours, coords, closed).
- Characters only claim coverage they were trained on.
- Do not clone the host. Characters are separate IP.

## Data

- Seed catalog in `src/lib/catalog.ts`.
- Live TourAPI via `TOUR_API_KEY` in `.env.local` (`KorService2` + `EngService2` `locationBasedList2`).
- Ranking in `src/lib/engine.ts`. Harness in `src/lib/train.ts`.
