# Gaming the Gods / The Temple Game

A single-page React/Vite playtest aid for the ritual board game prototype. It helps players test movement, ritual value, legendary value, sacred items, small ritual boons, desecration, collective rites, gates, divine intervention cards, and the roaming leopard.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Vite will print a local URL, usually `http://127.0.0.1:5173/`.

## Mechanics In This Prototype

- Supports 3-6 human or AI players through the New Game setup flow.
- The board has three concentric playable levels: outer, middle, inner, plus the central altar.
- Each player starts with one Sacred Item that nudges their ritual style.
- Players start on the outer start tile and roll D4 for movement.
- Each player may roll D4 only once per turn.
- Movement is clockwise or counterclockwise along the current ring.
- Landing on a tile with an RV token grants +1 RV and removes the token.
- Event tiles draw one of 10 Divine Intervention cards.
- Gate costs default to 5 for the first gate and 7 for the second judgment.
- Divinity Points = RV + LV. Gate payment spends RV first, then LV.
- After two paid judgments, the inner-level altar gate is the final win target.
- Players may gain Ritual Boons: up to 2 Followers and 2 Relics, with Bound Scroll allowing 3 Followers.
- Leopard movement desecrates non-altar tiles. Cleansing a desecrated tile restores an RV token and grants +1 LV.
- When the outer ring has no RV tokens, a Collective Rite asks each sect to Give or Withhold.
- Board and panels use lightweight SVG token art for leopard, events, gates, sacred items, followers, and relics.
- Hover or focus the help icons beside events, boons, rituals, and turn controls for quick rules reminders.
- After each turn, the leopard rolls D10:
  - 1-2 clockwise
  - 3-4 counterclockwise
  - 5-7 outward
  - 8-9 stalks and does not move
  - 10 inward
- Leopard altar visits increment leopard LV/visits. The digital balance default is 4 visits before collective loss; Playtest Mode can tune this threshold.
- If the leopard lands adjacent to non-protected players, it eats at most one of them, prioritizing a player on its tile. The eaten player loses half RV rounded up, returns to start, and gains LV equal to leopard visits + 1.

## Sacred Items

- Sacred Chalice: first time entering a new tier, gain +1 LV.
- Temple Knife: when sacrificing RV, gain +1 extra movement this turn.
- Olive Idol: manual once per round +1 RV if the player does not move toward the altar.
- Funeral Mask: when eaten by the leopard, gain +1 extra LV.
- Bronze Bell: after drawing an event card, rotate the second tier 1 additional tile.
- Bound Scroll: hold 1 extra Follower.

## Ritual Boons

Followers and Relics are intentionally lightweight. Many effects are automated and logged; effects that require a judgment call appear as manual trigger buttons in the Player Panel.

Followers: Acolyte, Witness, Mourner, Scribe, Gatekeeper, Oracle.

Relics: Cracked Chalice, Olive Branch, Bronze Mirror, Knotted Cord, Ash Bowl, Leopard Tooth.

## Playtest Mode

Use the Playtest Mode toggle to expose manual controls:

- Add/remove RV or LV.
- Nudge player positions.
- Move the leopard.
- Rotate the second tier.
- Draw a specific Divine Intervention card.
- Manually roll leopard D10 or draw event cards for testing. In normal play, event cards draw from Divine tiles and leopard movement happens through End Turn.
- Assign/change Sacred Items.
- Add/remove Followers and Relics.
- Mark or cleanse tiles.
- Trigger a Collective Rite.
- Modify gate costs and leopard loss threshold.

## AI Rivals

During setup, toggle any sect between Human and AI Rival. AI turns resolve automatically: the AI rolls D4, moves toward useful RV or desecrated tiles while short on Divinity Points, heads for gates when it can pay, resolves event cards, gains boons, and ends its turn with leopard movement.

## Known Simplifications

- The board is represented as three playable circular tiers plus the central altar. The first two tiers contain the paid advancement judgments, and the inner tier is the final approach.
- The physical rotating board is modeled by shifting the second-tier tile array.
- Complex secret-choice event cards are automated with readable log output so a playtest can keep moving. Collective Rite uses a guided modal.
- Gate positioning and facing the next gate are approximated by current sector alignment and proximity.
- The leopard can move between rings without gates, matching the rule that it is not confined by sacred boundaries.
- Follower sacrifice on leopard encounters is automated when it would prevent RV loss.
- Bronze Mirror is simplified as a once-per-game copied relic effect that grants +1 LV.
