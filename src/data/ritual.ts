import { FollowerId, RelicId, SacredItemId } from "../types";

export type RitualOption<T extends string> = {
  id: T;
  name: string;
  text: string;
};

export const SACRED_ITEMS: RitualOption<SacredItemId>[] = [
  { id: "sacred-chalice", name: "Sacred Chalice", text: "First time entering a new tier, gain +1 LV." },
  { id: "temple-knife", name: "Temple Knife", text: "When sacrificing RV, gain +1 extra movement this turn." },
  { id: "olive-idol", name: "Olive Idol", text: "Once per round, if you do not move toward the altar, gain +1 RV." },
  { id: "funeral-mask", name: "Funeral Mask", text: "When eaten by the leopard, gain +1 extra LV." },
  { id: "bronze-bell", name: "Bronze Bell", text: "After drawing an event card, rotate the second tier 1 tile." },
  { id: "bound-scroll", name: "Bound Scroll", text: "You may hold 1 extra Follower." },
];

export const FOLLOWERS: RitualOption<FollowerId>[] = [
  { id: "acolyte", name: "Acolyte", text: "Once per turn, when you gain RV, gain +1 extra RV." },
  { id: "witness", name: "Witness", text: "When another player on your tier gains LV, gain +1 RV." },
  { id: "mourner", name: "Mourner", text: "When eaten by the leopard, lose 1 less RV." },
  { id: "scribe", name: "Scribe", text: "When you resolve an event card, gain +1 RV." },
  { id: "gatekeeper", name: "Gatekeeper", text: "Once per game, reduce a gate cost by 2." },
  { id: "oracle", name: "Oracle", text: "Once per turn, reroll movement, but keep the second result." },
];

export const RELICS: RitualOption<RelicId>[] = [
  { id: "cracked-chalice", name: "Cracked Chalice", text: "When you lose RV, gain +1 LV." },
  { id: "olive-branch", name: "Olive Branch", text: "Once per round, if adjacent to another player, both may gain +1 RV." },
  { id: "bronze-mirror", name: "Bronze Mirror", text: "Once per game, copy another player's Relic effect." },
  { id: "knotted-cord", name: "Knotted Cord", text: "Move 1 fewer tile than rolled to gain +1 RV." },
  { id: "ash-bowl", name: "Ash Bowl", text: "When an event harms you, gain +1 LV afterward." },
  { id: "leopard-tooth", name: "Leopard Tooth", text: "Leopard encounters give +1 extra LV, but you lose 1 additional RV." },
];

export function optionName<T extends string>(options: RitualOption<T>[], id: T): string {
  return options.find((option) => option.id === id)?.name ?? id;
}

export const sacredItemName = (id: SacredItemId) => optionName(SACRED_ITEMS, id);
export const followerName = (id: FollowerId) => optionName(FOLLOWERS, id);
export const relicName = (id: RelicId) => optionName(RELICS, id);
