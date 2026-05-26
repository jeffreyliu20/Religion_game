import { EventCard } from "../types";

export const EVENT_CARDS: EventCard[] = [
  {
    id: "cooperation",
    title: "Cooperation",
    rules: [
      "Choose another player on the same sacred level.",
      "Swap places.",
      "Both players gain +1 RV.",
      "Rotate the second tier counterclockwise up to 3 tiles.",
      "Current player gains 1 Follower.",
    ],
    flavor: "Even rivals kneel on the same stone when the gods are watching.",
  },
  {
    id: "asceticism",
    title: "Asceticism",
    rules: ["Gain D4 additional movement this turn.", "Lose 2 RV."],
    flavor: "What is surrendered in flesh returns as swiftness of spirit.",
  },
  {
    id: "collective-alms",
    title: "Collective Alms",
    rules: [
      "Each player loses 1 RV if possible, otherwise 1 LV if possible.",
      "Trigger a Collective Rite instead of refilling automatically.",
    ],
    flavor:
      "Sanctity is not sustained by one offering, but by all who are made to give.",
  },
  {
    id: "sect-surge",
    title: "Sect Surge",
    rules: [
      "Rotate the second tier clockwise or counterclockwise up to 2 tiles.",
      "Any player facing the direction of the next gate gains +1 RV.",
    ],
    flavor:
      "The faithful do not move the temple-the temple turns, and calls them forward.",
  },
  {
    id: "test-of-faith",
    title: "Test of Faith",
    rules: [
      "Current player loses all RV, call this n.",
      "Roll D4.",
      "If n >= D4 result, choose safe LV or attempt an omen challenge.",
      "Safe: gain 1 LV. Challenge success: gain up to 2 LV and 1 Relic. Failure: lose 1 LV.",
    ],
    flavor:
      "Only when all is lost can the gods decide what was worth keeping.",
  },
  {
    id: "guiding-hand",
    title: "The Guiding Hand",
    rules: [
      "Either pay 1 RV to rotate the nearest gate directly in front of yourself, or gain 1 RV by rotating it in front of another player.",
    ],
    flavor:
      "A gate is never where it stands, but where the will of the divine places it.",
  },
  {
    id: "sacrificial-rebirth",
    title: "Sacrificial Rebirth",
    rules: [
      "Move leopard to current player's tile.",
      "Trigger leopard encounter immediately.",
      "This turn, the player loses no RV from being eaten but returns to start.",
      "Gain 1 Follower.",
    ],
    flavor:
      "To be devoured in the sacred place is not an end, but a beginning rewritten.",
  },
  {
    id: "gamble",
    title: "Gamble of the Unfaithful",
    rules: [
      "All players choose a number 1-4.",
      "Roll D4. Matching players gain +1 LV.",
      "Non-matching players may retry. Matching retry players gain +2 LV.",
      "Still non-matching retry players lose 2 LV if possible, otherwise 2 RV.",
      "Human current player may Cast the Lots for +1 LV and 1 Relic. Failure loses 1 LV.",
    ],
    flavor:
      "Those who doubt the gods must wager with them-and pay in certainty.",
  },
  {
    id: "trial-of-the-blind",
    title: "Trial of the Blind",
    rules: [
      "Other players secretly roll D4; sum hidden total X.",
      "Current player rolls D4 any number of times, accumulating sum Y.",
      "Human current player may Recite the Rite for +2 LV, or take +1 LV safely. Failure loses 1 LV.",
    ],
    flavor:
      "Faith walks forward without seeing, and is judged by what it dares to risk.",
  },
  {
    id: "bound-faith",
    title: "Rite of Bound Faith",
    rules: [
      "Each player secretly chooses Faith or Sacrifice.",
      "All Faith: everyone gains +2 RV.",
      "All Sacrifice: everyone gains 0.",
      "Mixed: everyone gains +1 RV.",
    ],
    flavor:
      "Alone, belief falters. Together, it binds-or breaks-all who partake.",
  },
];

export const getCard = (id: string) => EVENT_CARDS.find((card) => card.id === id);
