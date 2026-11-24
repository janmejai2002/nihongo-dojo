# learner/

Everything in this folder is **personal and gitignored**. It is where the course stops being a
generic curriculum and becomes yours.

| File | What it is |
|---|---|
| `profile.md` | Who you are, your baseline, how you learn, your constraints, what is still unmeasured. Claude reads this first every session. |
| `log.md` | Append-only session log. What was covered, what you got wrong, what the next session opens with. |
| `progress.json` | SRS snapshot, synced out of the dashboard. |

If you clone this repo fresh, these three do not exist yet. Create them by running `/nihon` and
answering the placement drill — Claude writes them from what it learns about you.

## Why these are not committed

Two reasons. The obvious one is privacy: the profile contains facts about you, and the log contains
a record of your mistakes. The less obvious one is that a curriculum and a learner are different
objects with different lifetimes — the curriculum is shareable and improves for everyone, the
profile is a single person's. Keeping them apart is what lets this repo be both a personal course
and something another learner can pick up.

If you want version history of your own progress, add a second private remote and push a branch
that un-ignores this folder. Do not push it to the public one.
