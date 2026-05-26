import {
  CollectiveRiteChoice,
  Direction,
  EventCardId,
  FollowerId,
  GameLogEntry,
  GameNotification,
  GameState,
  PendingChallenge,
  Player,
  Position,
  RelicId,
  RitualBoonType,
  SacredItemId,
  Tile,
  TileType,
} from "./types";
import { EVENT_CARDS, getCard } from "./data/cards";
import { FOLLOWERS, RELICS, SACRED_ITEMS, followerName, relicName, sacredItemName } from "./data/ritual";

const OUTER_TILES = 16;
const SECOND_TILES = 12;
const INNER_TILES = 8;
const TILE_COUNTS = [OUTER_TILES, SECOND_TILES, INNER_TILES];
const INNER_TIER = 2;
const ALTAR_TIER = 3;
const PAID_GATES_TO_WIN = 2;
export const BALANCE_VERSION = 5;
export const DEFAULT_LEOPARD_LOSS_THRESHOLD = 3;
export const DEFAULT_LEGENDARY_VICTORY_THRESHOLD = 15;
const START: Position = { tier: 0, index: 0 };
const PLAYER_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0f766e"];
const AI_PERSONALITIES = ["pilgrim", "martyr", "steward", "trickster"] as const;

export type GameAction =
  | { type: "NEW_GAME"; playerCount: number; names: string[]; aiPlayers: boolean[]; sacredItems: SacredItemId[] }
  | { type: "RESET" }
  | { type: "ROLL_D4" }
  | { type: "ROLL_D10" }
  | { type: "MOVE_PLAYER"; direction: Direction }
  | { type: "AI_TURN" }
  | { type: "END_TURN" }
  | { type: "DRAW_EVENT"; cardId?: EventCardId }
  | { type: "CLEANSE_TILE" }
  | { type: "TRIGGER_ITEM"; playerId: string }
  | { type: "TRIGGER_FOLLOWER"; playerId: string; follower: FollowerId }
  | { type: "TRIGGER_RELIC"; playerId: string; relic: RelicId }
  | { type: "RECRUIT_BOON_WITH_LV"; playerId: string; boonType: RitualBoonType }
  | { type: "BUY_DIE_UPGRADE"; playerId: string }
  | { type: "BUY_LEOPARD_WARD"; playerId: string }
  | { type: "RESOLVE_CHALLENGE"; accepted: boolean; success?: boolean }
  | { type: "TOGGLE_PLAYTEST" }
  | { type: "ADJUST_PLAYER"; playerId: string; stat: "rv" | "lv"; delta: number }
  | { type: "NUDGE_PLAYER"; playerId: string; direction: Direction | "in" | "out" | "start" }
  | { type: "MOVE_LEOPARD"; direction: Direction | "in" | "out" | "start" }
  | { type: "ROTATE_SECOND"; steps: number }
  | { type: "SET_SACRED_ITEM"; playerId: string; sacredItem: SacredItemId }
  | { type: "ADD_FOLLOWER"; playerId: string; follower: FollowerId }
  | { type: "REMOVE_FOLLOWER"; playerId: string; follower: FollowerId }
  | { type: "ADD_RELIC"; playerId: string; relic: RelicId }
  | { type: "REMOVE_RELIC"; playerId: string; relic: RelicId }
  | { type: "DISCARD_BOON"; playerId: string; boonType: RitualBoonType; boonId: FollowerId | RelicId }
  | { type: "MARK_CURRENT_TILE"; desecrated: boolean }
  | { type: "MARK_LEOPARD_TILE"; desecrated: boolean }
  | { type: "START_COLLECTIVE_RITE" }
  | { type: "SET_RITE_CHOICE"; playerId: string; choice: CollectiveRiteChoice }
  | { type: "RESOLVE_COLLECTIVE_RITE" }
  | { type: "DISMISS_RITE_REVEAL" }
  | { type: "SET_GATE_COST"; gate: 0 | 1; cost: number }
  | { type: "SET_LEOPARD_THRESHOLD"; threshold: number }
  | { type: "SET_LEGENDARY_THRESHOLD"; threshold: number }
  | { type: "DISMISS_NOTIFICATION"; notificationId: string };

export const emptyState = (): GameState => ({
  balanceVersion: BALANCE_VERSION,
  setupComplete: false,
  players: [],
  currentPlayerIndex: 0,
  board: createBoard(),
  leopard: { ...START },
  leopardVisits: 0,
  leopardLossThreshold: DEFAULT_LEOPARD_LOSS_THRESHOLD,
  legendaryVictoryThreshold: DEFAULT_LEGENDARY_VICTORY_THRESHOLD,
  gateCosts: [5, 7],
  pendingMove: 0,
  turnRolled: false,
  lastRolls: {},
  playtestMode: false,
  notifications: [],
  log: [logEntry("Prepare the temple and choose 3-6 sects to begin.")],
});

export function reducer(state: GameState, action: GameAction): GameState {
  if (action.type === "RESET") return emptyState();
  if (state.gameOver && action.type === "RESOLVE_CHALLENGE") return { ...state, pendingChallenge: undefined };
  if (
    state.gameOver &&
    !["RESET", "NEW_GAME", "TOGGLE_PLAYTEST", "SET_RITE_CHOICE", "RESOLVE_COLLECTIVE_RITE", "DISMISS_RITE_REVEAL", "DISMISS_NOTIFICATION"].includes(action.type)
  ) {
    return addLog(state, "The ritual has ended. Reset or start a new game to continue.");
  }

  switch (action.type) {
    case "NEW_GAME":
      return newGame(action.playerCount, action.names, action.aiPlayers, action.sacredItems);
    case "ROLL_D4": {
      if (currentPlayer(state).isAI) return addLog(state, `${currentPlayer(state).name} is controlled by AI.`);
      if (state.turnRolled) return addLog(state, `${currentPlayer(state).name} has already rolled this turn.`);
      const sides = currentPlayer(state).movementDie ?? 4;
      const roll = d(sides);
      return addLog(
        { ...state, pendingMove: roll, turnRolled: true, lastRolls: { ...state.lastRolls, d4: roll } },
        `${currentPlayer(state).name} rolled D${sides} = ${roll}.`,
      );
    }
    case "ROLL_D10":
      if (!state.playtestMode) return addLog(state, "Leopard D10 rolls happen automatically when you end the turn.");
      return moveLeopardByRoll(state);
    case "MOVE_PLAYER":
      if (currentPlayer(state).isAI) return addLog(state, `${currentPlayer(state).name} is controlled by AI.`);
      if (!state.turnRolled) return addLog(state, `${currentPlayer(state).name} must roll D4 before moving.`);
      return moveCurrentPlayer(state, action.direction);
    case "AI_TURN":
      return runAiTurn(state);
    case "END_TURN":
      if (!state.turnRolled) return addLog(state, `${currentPlayer(state).name} must roll D4 before ending the turn.`);
      return finishTurn(state);
    case "DRAW_EVENT":
      if (!state.playtestMode) return addLog(state, "Divine Intervention cards are drawn automatically from event tiles. Enable Playtest Mode to draw manually.");
      return resolveEvent(state, action.cardId ?? randomCardId());
    case "CLEANSE_TILE":
      if (!state.turnRolled) return addLog(state, `${currentPlayer(state).name} must begin the turn before cleansing.`);
      return cleanseCurrentTile(state);
    case "TRIGGER_ITEM":
      return triggerSacredItem(state, action.playerId);
    case "TRIGGER_FOLLOWER":
      return triggerFollower(state, action.playerId, action.follower);
    case "TRIGGER_RELIC":
      return triggerRelic(state, action.playerId, action.relic);
    case "RECRUIT_BOON_WITH_LV":
      return recruitBoonWithLv(state, action.playerId, action.boonType);
    case "BUY_DIE_UPGRADE":
      return buyDieUpgrade(state, action.playerId);
    case "BUY_LEOPARD_WARD":
      return buyLeopardWard(state, action.playerId);
    case "RESOLVE_CHALLENGE":
      return resolveChallenge(state, action.accepted, action.success ?? false);
    case "TOGGLE_PLAYTEST":
      return addLog({ ...state, playtestMode: !state.playtestMode }, `Playtest Mode ${state.playtestMode ? "disabled" : "enabled"}.`);
    case "ADJUST_PLAYER":
      return updatePlayer(state, action.playerId, (player) => ({
        ...player,
        [action.stat]: Math.max(0, player[action.stat] + action.delta),
      }));
    case "NUDGE_PLAYER":
      return nudgePlayer(state, action.playerId, action.direction);
    case "MOVE_LEOPARD":
      return moveLeopardManually(state, action.direction);
    case "ROTATE_SECOND":
      return addLog(rotateSecondTier(state, action.steps), `Second tier rotated ${describeSteps(action.steps)}.`);
    case "SET_SACRED_ITEM":
      return addLog(updatePlayer(state, action.playerId, (p) => ({ ...p, sacredItem: action.sacredItem })), `${playerName(state, action.playerId)} now carries the ${sacredItemName(action.sacredItem)}.`);
    case "ADD_FOLLOWER":
      return addBoon(state, action.playerId, "follower", action.follower, "playtest control");
    case "REMOVE_FOLLOWER":
      return removeBoon(state, action.playerId, "follower", action.follower);
    case "ADD_RELIC":
      return addBoon(state, action.playerId, "relic", action.relic, "playtest control");
    case "REMOVE_RELIC":
      return removeBoon(state, action.playerId, "relic", action.relic);
    case "DISCARD_BOON":
      return { ...removeBoon(state, action.playerId, action.boonType, action.boonId), pendingDiscard: undefined };
    case "MARK_CURRENT_TILE":
      return markTile(state, currentPlayer(state).position, action.desecrated);
    case "MARK_LEOPARD_TILE":
      return markTile(state, state.leopard, action.desecrated);
    case "START_COLLECTIVE_RITE":
      return startCollectiveRite(state, "Playtest Mode triggers a Collective Rite.");
    case "SET_RITE_CHOICE": {
      const choices = state.collectiveRite?.choices ?? {};
      if (choices[action.playerId]) return state;
      return {
        ...state,
        collectiveRite: {
          choices: { ...choices, [action.playerId]: action.choice },
        },
      };
    }
    case "RESOLVE_COLLECTIVE_RITE":
      return resolveCollectiveRite(state);
    case "DISMISS_RITE_REVEAL":
      return { ...state, riteResolution: undefined };
    case "SET_GATE_COST":
      return addLog({ ...state, gateCosts: action.gate === 0 ? [action.cost, state.gateCosts[1]] : [state.gateCosts[0], action.cost] }, `Gate ${action.gate + 1} cost set to ${action.cost}.`);
    case "SET_LEOPARD_THRESHOLD":
      return addLog({ ...state, leopardLossThreshold: action.threshold }, `Leopard loss threshold set to ${action.threshold} altar visits.`);
    case "SET_LEGENDARY_THRESHOLD":
      return addLog({ ...state, legendaryVictoryThreshold: action.threshold }, `Legendary cult victory threshold set to ${action.threshold} LV.`);
    case "DISMISS_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((notification) => notification.id !== action.notificationId),
      };
    default:
      return state;
  }
}

export function createBoard(): Tile[][] {
  return [
    Array.from({ length: OUTER_TILES }, (_, index) => makeTile(0, index, outerType(index))),
    Array.from({ length: SECOND_TILES }, (_, index) => makeTile(1, index, secondType(index))),
    Array.from({ length: INNER_TILES }, (_, index) => makeTile(2, index, innerType(index))),
  ];
}

export function isProtectedPosition(position: Position): boolean {
  return position.tier === 0 && [0, 1, OUTER_TILES - 1].includes(position.index);
}

export function getTile(board: Tile[][], position: Position): Tile {
  return board[position.tier][position.index % board[position.tier].length];
}

export function gatePower(player: Player): number {
  return player.rv + player.lv * 2;
}

export function tierLength(tier: number): number {
  return TILE_COUNTS[Math.max(0, Math.min(tier, TILE_COUNTS.length - 1))];
}

export function gateIndexForTier(state: GameState, tier: number): number {
  return state.board[tier]?.findIndex((tile) => tile.type === "gate") ?? -1;
}

function newGame(playerCount: number, names: string[], aiPlayers: boolean[], sacredItems: SacredItemId[]): GameState {
  const players = Array.from({ length: playerCount }, (_, index): Player => ({
    id: `p${index + 1}`,
    name: names[index]?.trim() || `Sect ${index + 1}`,
    isAI: aiPlayers[index] ?? index > 0,
    sacredItem: sacredItems[index] ?? SACRED_ITEMS[index % SACRED_ITEMS.length].id,
    followers: [],
    relics: [],
    enteredTiers: [0],
    uses: {},
    color: PLAYER_COLORS[index],
    position: { ...START },
    rv: 0,
    lv: 0,
    gatesPaid: 0,
    movementDie: 4,
    leopardWard: false,
    aiPersonality: aiPlayers[index] ? AI_PERSONALITIES[index % AI_PERSONALITIES.length] : undefined,
  }));

  return {
    balanceVersion: BALANCE_VERSION,
    setupComplete: true,
    players,
    currentPlayerIndex: 0,
    board: createBoard(),
    leopard: { ...START },
    leopardVisits: 0,
    leopardLossThreshold: DEFAULT_LEOPARD_LOSS_THRESHOLD,
    legendaryVictoryThreshold: DEFAULT_LEGENDARY_VICTORY_THRESHOLD,
    gateCosts: [5, 7],
    pendingMove: 0,
    turnRolled: false,
    lastRolls: {},
    playtestMode: false,
    notifications: [],
    log: [
      logEntry(`${playerCount} sects enter the outer court with sacred items.`),
      ...players.map((player) => logEntry(`${player.name} carries the ${sacredItemName(player.sacredItem)}.`)),
      ...players.filter((player) => player.isAI).map((player) => logEntry(`${player.name} follows the ${personalityName(player.aiPersonality)} AI path.`)),
      logEntry(`${players[0].name}'s turn begins${players[0].isAI ? " under AI control" : ""}.`),
    ],
  };
}

function makeTile(tier: number, index: number, type: TileType): Tile {
  return {
    id: `${tier}-${index}`,
    tier,
    index,
    type,
    label: type === "gate" ? "Gate" : type === "event" ? "Divine" : type === "shelter" ? "Shelter" : type === "start" ? "Start" : "Rite",
    hasRV: type !== "event" && type !== "start",
    desecrated: false,
  };
}

function outerType(index: number): TileType {
  if (index === 0) return "start";
  if (index === 1 || index === OUTER_TILES - 1) return "shelter";
  if (index === 4) return "gate";
  if ([3, 8, 13].includes(index)) return "event";
  return "normal";
}

function secondType(index: number): TileType {
  if (index === 9) return "gate";
  if ([2, 6, 10].includes(index)) return "event";
  return "normal";
}

function innerType(index: number): TileType {
  if (index === 2) return "gate";
  if ([4, 7].includes(index)) return "event";
  return "normal";
}

function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function moveCurrentPlayer(state: GameState, direction: Direction): GameState {
  if (state.pendingMove <= 0) return addLog(state, "Roll D4 before moving, use Oracle, or trigger a manual boon.");
  const player = currentPlayer(state);
  const moved = { ...player, position: nudgePosition(player.position, direction) };
  return handleLanding(replaceCurrentPlayer({ ...state, pendingMove: state.pendingMove - 1 }, moved), moved.id);
}

function runAiTurn(state: GameState): GameState {
  const aiPlayer = currentPlayer(state);
  if (!aiPlayer?.isAI) return state;
  let next = state;
  if (!next.turnRolled) {
    const sides = aiPlayer.movementDie ?? 4;
    const roll = d(sides);
    next = addLog({ ...next, pendingMove: roll, turnRolled: true, lastRolls: { ...next.lastRolls, d4: roll } }, `${aiPlayer.name} AI rolls D${sides} = ${roll}.`);
  }
  let safety = 0;
  while (next.pendingMove > 0 && !next.gameOver && !next.collectiveRite && safety < 12) {
    next = moveCurrentPlayer(next, chooseAiDirection(next));
    safety += 1;
  }
  if (next.gameOver || next.collectiveRite) return next;
  return finishTurn(addLog(next, `${aiPlayer.name} AI ends its turn.`));
}

function chooseAiDirection(state: GameState): Direction {
  const player = currentPlayer(state);
  const length = tierLength(player.position.tier);
  const gateIndex = gateIndexForTier(state, player.position.tier);
  const cost = gateCostForTier(state, player.position.tier);

  if (player.aiPersonality === "martyr" && !isAdjacent(player.position, state.leopard)) {
    return directionToward(player.position.index, mapIndex(state.leopard.index, tierLength(state.leopard.tier), length), length);
  }

  if (player.aiPersonality === "trickster") {
    const eventTile = state.board[player.position.tier].find((tile) => tile.type === "event");
    if (eventTile) return directionToward(player.position.index, eventTile.index, length);
  }

  if (gateIndex >= 0 && (player.aiPersonality === "pilgrim" || player.position.tier === INNER_TIER || gatePower(player) >= cost || player.gatesPaid >= player.position.tier + 1)) {
    return directionToward(player.position.index, gateIndex, length);
  }

  const target =
    (player.aiPersonality === "steward" ? state.board[player.position.tier].find((tile) => tile.desecrated)?.index : undefined) ??
    state.board[player.position.tier].find((tile) => tile.hasRV && !tile.desecrated)?.index ??
    state.board[player.position.tier].find((tile) => tile.desecrated)?.index ??
    gateIndex;
  return target >= 0 ? directionToward(player.position.index, target, length) : Math.random() >= 0.5 ? "cw" : "ccw";
}

function directionToward(from: number, to: number, length: number): Direction {
  return (to - from + length) % length <= (from - to + length) % length ? "cw" : "ccw";
}

function finishTurn(state: GameState): GameState {
  const afterLeopard = moveLeopardByRoll({ ...state, pendingMove: 0, turnRolled: false });
  if (afterLeopard.gameOver || afterLeopard.collectiveRite) return afterLeopard;
  const nextIndex = (afterLeopard.currentPlayerIndex + 1) % afterLeopard.players.length;
  const nextPlayer = afterLeopard.players[nextIndex];
  let next = { ...afterLeopard, currentPlayerIndex: nextIndex };
  next = updatePlayer(next, nextPlayer.id, (p) => ({
    ...p,
    uses: { ...p.uses, acolyteTurn: false, oracleTurn: false },
  }));
  if (nextIndex === 0) {
    next = {
      ...next,
      players: next.players.map((p) => ({
        ...p,
        uses: { ...p.uses, oliveIdolRound: false, oliveBranchRound: false },
      })),
    };
    next = addLog(rotateSecondTier(next, 1), "A new round begins; the second tier rotates 1 tile clockwise.");
  }
  return addLog(next, `${nextPlayer.name}'s turn begins${nextPlayer.isAI ? " under AI control" : ""}.`);
}

function handleLanding(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const tile = getTile(state.board, player.position);
  let next = state;

  if (tile.hasRV) {
    next = markTile(next, player.position, tile.desecrated, false);
    next = gainRv(next, playerId, 1, `${player.name} collected 1 RV from ${tile.label}.`);
    next = checkCollectiveRite(next);
  }

  if (tile.type === "event") {
    next = addLog(next, `${player.name} landed on a Divine Intervention tile.`);
    next = resolveEvent(next, randomCardId());
  }

  if (tile.type === "gate") {
    next = attemptGate(next, playerId);
  }

  return next;
}

function cleanseCurrentTile(state: GameState): GameState {
  const player = currentPlayer(state);
  const tile = getTile(state.board, player.position);
  if (!tile.desecrated) return addLog(state, `${player.name}'s tile is already cleansed.`);
  let next = markTile(state, player.position, false, true);
  next = gainLv(next, player.id, 1, `${player.name} cleanses desecration and gains 1 LV.`);
  if (!player.isAI) {
    next = beginChallenge(next, {
      id: challengeId("cleansing"),
      playerId: player.id,
      source: "cleansing",
      kind: "snake",
      safeRv: 0,
      successRv: 1,
      failureRv: -1,
      title: "Gather the Offerings",
      body: "The cleansed tile reveals scattered offerings. Take the certain cleansing, or gather all three offerings for +1 RV. Failure loses 1 RV.",
    });
  }
  return { ...next, pendingMove: 0, turnRolled: true };
}

function attemptGate(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;

  if (player.position.tier === INNER_TIER) {
    if (player.gatesPaid >= PAID_GATES_TO_WIN) return advanceThroughGate(state, playerId, false);
    return addLog(state, `${player.name} reached the altar gate but must pass both paid gate judgments first.`);
  }

  const requiredGate = player.position.tier + 1;
  if (player.gatesPaid >= requiredGate) return advanceThroughGate(state, playerId, false);

  let cost = gateCostForTier(state, player.position.tier);
  let usedGatekeeper = false;
  if (player.followers.includes("gatekeeper") && !player.uses.gatekeeperGame) {
    cost = Math.max(0, cost - 2);
    usedGatekeeper = true;
  }

  if (gatePower(player) < cost) return addLog(state, `${player.name} reached a gate but needs ${cost} Gate Power to pass.`);

  const payment = payGateCost(player, cost);
  const spentRv = payment.rv;
  const spentLv = payment.lv;
  let next = loseRv(state, playerId, spentRv, `${player.name} sacrifices ${spentRv} RV at the gate.`);
  next = updatePlayer(next, playerId, (p) => ({
    ...p,
    lv: p.lv - spentLv,
    gatesPaid: Math.max(p.gatesPaid, requiredGate),
    uses: { ...p.uses, gatekeeperGame: p.uses.gatekeeperGame || usedGatekeeper },
  }));
  if (spentLv > 0) next = addLog(next, `${player.name} spends ${spentLv} LV as ${spentLv * 2} Gate Power.`);
  if (usedGatekeeper) next = addLog(next, `${player.name}'s Gatekeeper reduces the judgment by 2.`);
  if (spentRv > 0 && player.sacredItem === "temple-knife") {
    next = addLog({ ...next, pendingMove: next.pendingMove + 1 }, `${player.name}'s Temple Knife grants +1 movement after RV sacrifice.`);
  }
  next = addBoon(next, playerId, Math.random() > 0.5 ? "follower" : "relic", undefined, "passing a gate for the first time");
  return advanceThroughGate(next, playerId, true);
}

function advanceThroughGate(state: GameState, playerId: string, paidNow: boolean): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.position.tier < INNER_TIER) {
    const nextTier = player.position.tier + 1;
    const index = mapIndex(player.position.index, tierLength(player.position.tier), tierLength(nextTier));
    let next = updatePlayer(addLog(state, `${player.name} enters ${tierName(nextTier)}${paidNow ? "" : " without repaying the gate"}.`), playerId, (p) => ({
      ...p,
      position: { tier: nextTier, index },
      enteredTiers: p.enteredTiers.includes(nextTier) ? p.enteredTiers : [...p.enteredTiers, nextTier],
    }));
    if (!player.enteredTiers.includes(nextTier)) {
      next = addBoon(next, playerId, Math.random() > 0.5 ? "follower" : "relic", undefined, "entering a new temple tier");
      if (player.sacredItem === "sacred-chalice") next = gainLv(next, playerId, 1, `${player.name}'s Sacred Chalice gains +1 LV for a new tier.`);
    }
    return next;
  }

  return addLog({ ...state, gameOver: "players-win", winnerId: playerId }, `${player.name} crosses the inner level and enters the altar. Their sacred item becomes divine.`);
}

function moveLeopardByRoll(state: GameState): GameState {
  const roll = d(10);
  if (roll === 7) {
    return addLog({ ...state, lastRolls: { ...state.lastRolls, d10: roll } }, `D10 = ${roll}. The leopard stalks the temple but does not move.`);
  }
  const direction = roll <= 2 ? "cw" : roll <= 4 ? "ccw" : roll <= 6 ? "out" : "in";
  return moveLeopard(state, direction, `D10 = ${roll}.`, roll);
}

function moveLeopardManually(state: GameState, direction: Direction | "in" | "out" | "start"): GameState {
  return moveLeopard(state, direction, "Playtest move:");
}

function moveLeopard(state: GameState, direction: Direction | "in" | "out" | "start", prefix: string, roll?: number): GameState {
  let nextPosition = nudgePosition(state.leopard, direction);
  let next = { ...state, lastRolls: roll ? { ...state.lastRolls, d10: roll } : state.lastRolls };
  if (nextPosition.tier >= ALTAR_TIER) {
    const visits = next.leopardVisits + 1;
    const visited = addLog({ ...next, leopard: { ...START }, leopardVisits: visits }, `${prefix} The leopard reaches the altar (${visits}/${next.leopardLossThreshold}) and returns to start.`);
    return visits >= next.leopardLossThreshold
      ? addLog({ ...visited, gameOver: "leopard-win" }, "The leopard has become the sacred object. All players lose.")
      : visited;
  }

  const firstTile = getTile(next.board, nextPosition);
  if (firstTile.type === "gate") {
    next = markTile(next, nextPosition, true);
    const slipDirection: Direction = direction === "ccw" ? "ccw" : "cw";
    nextPosition = nudgePosition(nextPosition, slipDirection);
    next = addLog(next, `${prefix} The leopard crosses a gate, but the sacred threshold repels it onward.`);
  }

  next = markTile({ ...next, leopard: nextPosition }, nextPosition, true);
  return checkLeopardEncounters(addLog(next, `${prefix} The leopard moves ${directionLabel(direction)} and desecrates tile ${nextPosition.index}.`));
}

function checkLeopardEncounters(state: GameState): GameState {
  let next = state;
  const eatenIds = state.players
    .filter((player) => isAdjacent(player.position, state.leopard) && !isProtectedPosition(player.position))
    .sort((a, b) => {
      const aSameTile = a.position.tier === state.leopard.tier && a.position.index === state.leopard.index ? 0 : 1;
      const bSameTile = b.position.tier === state.leopard.tier && b.position.index === state.leopard.index ? 0 : 1;
      return aSameTile - bSameTile;
    })
    .slice(0, 1)
    .map((player) => player.id);

  eatenIds.forEach((playerId) => {
    const player = next.players.find((p) => p.id === playerId)!;
    const baseLoss = Math.ceil(player.rv / 2);
    const lossWithRelics = baseLoss + (player.relics.includes("leopard-tooth") ? 1 : 0) - (player.followers.includes("mourner") ? 1 : 0);
    let lvGain = next.leopardVisits + 1 + (player.sacredItem === "funeral-mask" ? 1 : 0) + (player.relics.includes("leopard-tooth") ? 1 : 0);

    let noticeBody = "";
    if (player.leopardWard) {
      next = updatePlayer(next, playerId, (p) => ({ ...p, leopardWard: false }));
      next = addLog(next, `${player.name}'s leopard ward breaks and prevents the encounter.`);
      next = addNotification(next, {
        title: `${player.name} resisted the leopard`,
        body: "A purchased LV ward absorbed the leopard encounter. No RV was lost and the player stayed in place.",
        kind: "info",
      });
      return;
    }

    if (player.followers.length > 0 && baseLoss > 0) {
      const sacrificed = player.followers[0];
      next = removeBoon(next, playerId, "follower", sacrificed, false);
      next = addLog(next, `${player.name} sacrifices ${followerName(sacrificed)} to avoid losing RV to the leopard.`);
      noticeBody = `The leopard landed adjacent to ${player.name}. ${followerName(sacrificed)} was sacrificed, so no RV was lost.`;
    } else {
      const rvLost = Math.max(0, lossWithRelics);
      next = loseRv(next, playerId, rvLost, `${player.name} is eaten by the leopard.`);
      noticeBody = `The leopard landed adjacent to ${player.name}. They were eaten, lost ${rvLost} RV, and returned to Start.`;
    }
    next = updatePlayer(next, playerId, (p) => ({ ...p, position: { ...START } }));
    next = gainLv(next, playerId, lvGain, `${player.name} returns to start and gains ${lvGain} LV from the encounter.`);
    next = addNotification(next, {
      title: `${player.name} returned to Start`,
      body: `${noticeBody} They gained ${lvGain} LV from the encounter.`,
      kind: "return",
    });
    next = addBoon(next, playerId, Math.random() > 0.5 ? "follower" : "relic", undefined, "being eaten by the leopard");
  });

  if (eatenIds.length > 0) {
    next = addLog(next, "The leopard's attack ends after one encounter this turn.");
  }

  return next;
}

function resolveEvent(state: GameState, cardId: EventCardId): GameState {
  const card = getCard(cardId)!;
  let next = addLog({ ...state, lastCardId: cardId }, `Divine Intervention: ${card.title}.`);
  const player = currentPlayer(next);
  let harmed = false;

  switch (cardId) {
    case "cooperation": {
      const partner = next.players.find((p) => p.id !== player.id && p.position.tier === player.position.tier);
      if (partner) {
        const playerPos = player.position;
        const partnerPos = partner.position;
        next = updatePlayer(next, player.id, (p) => ({ ...p, position: partnerPos }));
        next = updatePlayer(next, partner.id, (p) => ({ ...p, position: playerPos }));
        next = gainRv(next, player.id, 1, `${player.name} gains 1 RV from Cooperation.`);
        next = gainRv(next, partner.id, 1, `${partner.name} gains 1 RV from Cooperation.`);
        next = rotateSecondTier(next, -3);
        if (Math.random() > 0.5) next = addBoon(next, player.id, "follower", undefined, "Cooperation gathering witnesses");
      } else next = addLog(next, "No rival stands on the same sacred level, so no swap occurs.");
      break;
    }
    case "asceticism": {
      const roll = d(4);
      next = loseRv(next, player.id, 2, `${player.name} loses 2 RV through Asceticism.`, true);
      next = addLog({ ...next, pendingMove: next.pendingMove + roll, lastRolls: { ...next.lastRolls, d4: roll } }, `${player.name} gains ${roll} extra movement.`);
      harmed = true;
      break;
    }
    case "collective-alms":
      next.players.forEach((p) => {
        next = p.rv > 0 ? loseRv(next, p.id, 1, `${p.name} gives 1 RV for Collective Alms.`, true) : gainLv(updatePlayer(next, p.id, (current) => ({ ...current, lv: Math.max(0, current.lv - 1) })), p.id, 0, `${p.name} has no RV and offers 1 LV instead.`);
      });
      next = startCollectiveRite(next, "Collective Alms opens a Collective Rite instead of refilling automatically.");
      harmed = true;
      break;
    case "sect-surge": {
      next = rotateSecondTier(next, 2);
      const gateIndex = next.board[1].findIndex((tile) => tile.type === "gate");
      next.players
        .filter((p) => p.position.tier === 1 && distanceOnRing(p.position.index, gateIndex, SECOND_TILES) <= 2)
        .forEach((p) => {
          next = gainRv(next, p.id, 1, `${p.name} faces the next gate and gains 1 RV.`);
        });
      break;
    }
    case "test-of-faith": {
      const n = player.rv;
      const roll = d(4);
      next = loseRv(next, player.id, n, `${player.name} loses all ${n} RV for Test of Faith.`, true);
      if (n >= roll) {
        const safeLv = 1;
        const successLv = Math.min(2, Math.max(1, Math.ceil(n / 3)));
        if (player.isAI) {
          const success = Math.random() >= 0.45;
          next = success
            ? gainLv(next, player.id, successLv, `${player.name} survives Test of Faith and gains ${successLv} LV.`)
            : loseLv(next, player.id, 1, `${player.name} fails the Test of Faith ordeal.`);
          if (success) next = addBoon(next, player.id, "relic", undefined, "surviving Test of Faith");
        } else {
          next = beginChallenge(next, {
            id: `test-faith-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            playerId: player.id,
            source: "test-of-faith",
            kind: "timing",
            safeLv,
            successLv,
            failureLv: -1,
            boonType: "relic",
            title: "Test of Faith",
            body: `${player.name} passed the first omen by rolling ${roll}. Take ${safeLv} LV safely, or attempt the omen challenge for ${successLv} LV and 1 Relic.`,
          });
        }
      } else next = addLog(next, `${player.name} rolls ${roll} and gains no LV.`);
      harmed = n > 0;
      break;
    }
    case "guiding-hand": {
      const gateIndex = next.board[1].findIndex((tile) => tile.type === "gate");
      const targetIndex = player.position.tier === 1 ? player.position.index : mapIndex(player.position.index, tierLength(player.position.tier), SECOND_TILES);
      if (player.rv > 0) {
        next = loseRv(next, player.id, 1, `${player.name} pays 1 RV to The Guiding Hand.`, true);
        next = rotateSecondTier(next, targetIndex - gateIndex);
        harmed = true;
      } else {
        next = gainRv(next, player.id, 1, `${player.name} gains 1 RV by turning a gate toward another sect.`);
        const rival = next.players.find((p) => p.id !== player.id) ?? player;
        next = rotateSecondTier(next, rival.position.index - gateIndex);
      }
      break;
    }
    case "sacrificial-rebirth":
      next = updatePlayer(next, player.id, (p) => ({ ...p, position: { ...START } }));
      if (player.isAI) {
        next = gainLv(next, player.id, next.leopardVisits + 1, `${player.name} is ritually devoured, loses no RV, and gains LV.`);
        next = addBoon(next, player.id, "follower", undefined, "Sacrificial Rebirth");
      } else {
        const safeLv = 1;
        next = beginChallenge(next, {
          id: challengeId("leopard"),
          playerId: player.id,
          source: "leopard-encounter",
          kind: "runner",
          safeLv,
          successLv: Math.min(2, next.leopardVisits + 1),
          failureLv: -1,
          boonType: "follower",
          title: "Flight Through the Outer Court",
          body: "The leopard has devoured the body, but the story can still outrun it. Take the certain rebirth or leap the shadow for extra LV and a Follower.",
        });
      }
      next = addNotification(next, {
        title: `${player.name} returned to Start`,
        body: "Sacrificial Rebirth moved the leopard to them. They were ritually devoured, lost no RV, and restarted with new LV.",
        kind: "return",
      });
      break;
    case "gamble":
      next = resolveGamble(next);
      if (player.isAI) {
        next = addBoon(next, player.id, "relic", undefined, "Gamble of the Unfaithful");
      } else {
        next = beginChallenge(next, {
          id: challengeId("gamble"),
          playerId: player.id,
          source: "gamble",
          kind: "coin",
          safeRv: 1,
          successLv: 1,
          failureLv: -1,
          boonType: "relic",
          title: "Cast the Lots",
          body: "Choose Sun or Moon. Take +1 RV with certainty, or cast the lots for +1 LV and 1 Relic. Failure loses 1 LV.",
        });
      }
      break;
    case "trial-of-the-blind":
      next = player.isAI ? resolveTrial(next) : beginChallenge(next, {
        id: challengeId("trial"),
        playerId: player.id,
        source: "trial-of-the-blind",
        kind: "memory",
        safeLv: 1,
        successLv: 2,
        failureLv: -1,
        title: "Recite the Rite",
        body: "The blind trial becomes a sequence of sacred signs. Take +1 LV, or recite the rite for +2 LV. Failure loses 1 LV.",
      });
      break;
    case "bound-faith":
      next = resolveBoundFaith(next);
      next.players.forEach((p) => {
        if (Math.random() > 0.75) next = addBoon(next, p.id, "follower", undefined, "Rite of Bound Faith");
      });
      break;
    default:
      break;
  }

  if (harmed && player.relics.includes("ash-bowl")) next = gainLv(next, player.id, 1, `${player.name}'s Ash Bowl turns harm into +1 LV.`);
  if (player.followers.includes("scribe")) next = gainRv(next, player.id, 1, `${player.name}'s Scribe records the event for +1 RV.`);
  next = rotateSecondTier(next, 1);
  next = addLog(next, "After divine intervention, the second tier rotates 1 tile clockwise.");
  if (player.sacredItem === "bronze-bell") {
    next = rotateSecondTier(next, 1);
    next = addLog(next, `${player.name}'s Bronze Bell rotates the second tier 1 additional tile.`);
  }
  return checkCollectiveRite(next);
}

function resolveGamble(state: GameState): GameState {
  let next = state;
  const firstRoll = d(4);
  const choices = new Map(state.players.map((p) => [p.id, d(4)]));
  const unmatched = state.players.filter((p) => choices.get(p.id) !== firstRoll);
  state.players.filter((p) => choices.get(p.id) === firstRoll).forEach((p) => {
    next = gainLv(next, p.id, 1, `${p.name} matches the first gamble roll and gains 1 LV.`);
  });
  const secondRoll = d(4);
  unmatched.forEach((p) => {
    const retry = d(4);
    if (retry === secondRoll) next = gainLv(next, p.id, 2, `${p.name} matches the retry and gains 2 LV.`);
    else next = p.lv >= 2 ? updatePlayer(addLog(next, `${p.name} fails the gamble and loses 2 LV.`), p.id, (current) => ({ ...current, lv: current.lv - 2 })) : loseRv(next, p.id, 2, `${p.name} fails the gamble and loses RV.`, true);
  });
  return addLog(next, `Gamble resolves with rolls ${firstRoll} then ${secondRoll}; guesses are automated for playtest speed.`);
}

function resolveTrial(state: GameState): GameState {
  const player = currentPlayer(state);
  const hidden = state.players.filter((p) => p.id !== player.id).reduce((sum) => sum + d(4), 0);
  let y = 0;
  let rolls = 0;
  while (rolls < 4 && y + 2 <= hidden) {
    y += d(4);
    rolls += 1;
  }
  if (y > hidden) {
    let next = loseRv(state, player.id, 2, `${player.name}'s blind trial exceeds ${hidden}.`, true);
    next.players.filter((p) => p.id !== player.id).forEach((p) => {
      next = gainRv(next, p.id, 2, `${p.name} gains 2 RV from the failed trial.`);
    });
    return next;
  }
  return gainLv(state, player.id, Math.min(2, rolls), `${player.name} stops the blind trial at ${y} against hidden total ${hidden}, gaining ${Math.min(2, rolls)} LV.`);
}

function resolveBoundFaith(state: GameState): GameState {
  const choices = state.players.map((p) => ({ player: p, faith: Math.random() >= 0.5 }));
  const allFaith = choices.every((choice) => choice.faith);
  const allSacrifice = choices.every((choice) => !choice.faith);
  let next = state;
  choices.forEach(({ player, faith }) => {
    const gain = allFaith ? 2 : allSacrifice ? 0 : 1;
    if (gain > 0) next = gainRv(next, player.id, gain, `${player.name} gains ${gain} RV from Bound Faith.`);
  });
  return addLog(next, `Rite of Bound Faith resolves: ${allFaith ? "all Faith" : allSacrifice ? "all Sacrifice" : "mixed vows"}.`);
}

function recruitBoonWithLv(state: GameState, playerId: string, boonType: RitualBoonType): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.lv < 2) return addLog(state, `${player.name} needs 2 LV to recruit a ${boonType}.`);
  if (state.currentPlayerIndex !== state.players.findIndex((p) => p.id === playerId)) {
    return addLog(state, `${player.name} can only recruit with LV on their own turn.`);
  }
  if (!state.turnRolled) return addLog(state, `${player.name} must complete a turn action before recruiting with LV.`);
  if (state.pendingMove > 0) return addLog(state, `${player.name} must finish movement before recruiting with LV.`);

  const next = updatePlayer(state, playerId, (p) => ({ ...p, lv: p.lv - 2 }));
  return addBoon(next, playerId, boonType, undefined, "legendary reputation");
}

function buyDieUpgrade(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const currentDie = player.movementDie ?? 4;
  if (currentDie >= 10) return addLog(state, `${player.name}'s movement die is already D10.`);
  const cost = currentDie === 4 ? 3 : 5;
  if (player.lv < cost) return addLog(state, `${player.name} needs ${cost} LV to upgrade movement.`);
  const nextDie = currentDie === 4 ? 6 : 10;
  return addLog(
    updatePlayer(state, playerId, (p) => ({ ...p, lv: p.lv - cost, movementDie: nextDie })),
    `${player.name} spends ${cost} LV to upgrade movement to D${nextDie}.`,
  );
}

function buyLeopardWard(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.leopardWard) return addLog(state, `${player.name} already has a leopard ward.`);
  if (player.lv < 2) return addLog(state, `${player.name} needs 2 LV to bind a leopard ward.`);
  return addLog(
    updatePlayer(state, playerId, (p) => ({ ...p, lv: p.lv - 2, leopardWard: true })),
    `${player.name} spends 2 LV to bind a leopard ward.`,
  );
}

function beginChallenge(state: GameState, challenge: PendingChallenge): GameState {
  if (state.gameOver) return state;
  return addLog({ ...state, pendingChallenge: challenge }, `${playerName(state, challenge.playerId)} may attempt ${challenge.title} for a greater legend.`);
}

function resolveChallenge(state: GameState, accepted: boolean, success: boolean): GameState {
  const challenge = state.pendingChallenge;
  if (!challenge) return state;
  let next: GameState = { ...state, pendingChallenge: undefined };
  const player = next.players.find((p) => p.id === challenge.playerId)!;

  if (!accepted) {
    next = applyChallengeDelta(next, player.id, challenge.safeRv ?? 0, challenge.safeLv ?? 0, `${player.name} takes the certain sign.`);
    return next;
  }

  if (!success) {
    next = applyChallengeDelta(next, player.id, challenge.failureRv ?? 0, challenge.failureLv ?? -1, `${player.name} fails the ordeal.`);
    return next;
  }

  next = applyChallengeDelta(next, player.id, challenge.successRv ?? 0, challenge.successLv ?? 0, `${player.name} succeeds at ${challenge.title}.`);
  if (challenge.boonType) next = addBoon(next, player.id, challenge.boonType, undefined, `winning ${challenge.title}`);
  return next;
}

function applyChallengeDelta(state: GameState, playerId: string, rv: number, lv: number, reason: string): GameState {
  let next = state;
  if (rv > 0) next = gainRv(next, playerId, rv, `${reason} +${rv} RV.`);
  if (rv < 0) next = loseRv(next, playerId, Math.abs(rv), `${reason}`);
  if (lv > 0) next = gainLv(next, playerId, lv, `${reason} +${lv} LV.`);
  if (lv < 0) next = loseLv(next, playerId, Math.abs(lv), `${reason}`);
  if (rv === 0 && lv === 0) next = addLog(next, `${reason} No extra reward.`);
  return next;
}

function triggerSacredItem(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.sacredItem !== "olive-idol") return addLog(state, `${sacredItemName(player.sacredItem)} has no manual trigger.`);
  if (player.uses.oliveIdolRound) return addLog(state, `${player.name}'s Olive Idol has already been used this round.`);
  return gainRv(
    updatePlayer(state, playerId, (p) => ({ ...p, uses: { ...p.uses, oliveIdolRound: true } })),
    playerId,
    1,
    `${player.name}'s Olive Idol grants +1 RV for not moving toward the altar.`,
  );
}

function triggerFollower(state: GameState, playerId: string, follower: FollowerId): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  if (!player.followers.includes(follower)) return state;
  if (follower !== "oracle") return addLog(state, `${followerName(follower)} is automatic in this prototype.`);
  if (!state.turnRolled) return addLog(state, `${player.name} must roll before Oracle can reroll movement.`);
  if (player.uses.oracleTurn) return addLog(state, `${player.name}'s Oracle has already been used this turn.`);
  const roll = d(4);
  return addLog(
    updatePlayer({ ...state, pendingMove: roll, turnRolled: true, lastRolls: { ...state.lastRolls, d4: roll } }, playerId, (p) => ({ ...p, uses: { ...p.uses, oracleTurn: true } })),
    `${player.name}'s Oracle rerolls movement. The second result is ${roll}.`,
  );
}

function triggerRelic(state: GameState, playerId: string, relic: RelicId): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  if (!player.relics.includes(relic)) return state;
  if (relic === "knotted-cord") {
    if (state.pendingMove <= 0) return addLog(state, "Knotted Cord needs pending movement to reduce.");
    return gainRv({ ...state, pendingMove: state.pendingMove - 1 }, playerId, 1, `${player.name}'s Knotted Cord reduces movement by 1 for +1 RV.`);
  }
  if (relic === "olive-branch") {
    if (player.uses.oliveBranchRound) return addLog(state, `${player.name}'s Olive Branch has already been used this round.`);
    const partner = state.players.find((p) => p.id !== playerId && isAdjacent(p.position, player.position));
    if (!partner) return addLog(state, `${player.name} is not adjacent to another player for Olive Branch.`);
    let next = updatePlayer(state, playerId, (p) => ({ ...p, uses: { ...p.uses, oliveBranchRound: true } }));
    next = gainRv(next, playerId, 1, `${player.name} gains 1 RV from Olive Branch.`);
    return gainRv(next, partner.id, 1, `${partner.name} shares Olive Branch and gains 1 RV.`);
  }
  if (relic === "bronze-mirror") {
    if (player.uses.bronzeMirrorGame) return addLog(state, `${player.name}'s Bronze Mirror has already been used.`);
    return gainLv(
      updatePlayer(state, playerId, (p) => ({ ...p, uses: { ...p.uses, bronzeMirrorGame: true } })),
      playerId,
      1,
      `${player.name}'s Bronze Mirror copies a rival relic as a simple +1 LV effect.`,
    );
  }
  return addLog(state, `${relicName(relic)} is automatic in this prototype.`);
}

function startCollectiveRite(state: GameState, reason: string): GameState {
  if (state.collectiveRite) return state;
  const choices: Record<string, CollectiveRiteChoice> = {};
  state.players.forEach((player) => {
    if (player.isAI) choices[player.id] = Math.random() >= 0.5 ? "give" : "withhold";
  });
  return addLog({ ...state, collectiveRite: { choices } }, reason);
}

function resolveCollectiveRite(state: GameState): GameState {
  if (!state.collectiveRite) return state;
  const choices = state.collectiveRite.choices;
  if (state.players.some((player) => !choices[player.id])) return addLog(state, "Choose Give or Withhold for every sect before resolving.");
  const values = state.players.map((player) => choices[player.id]);
  const allGive = values.every((choice) => choice === "give");
  const allWithhold = values.every((choice) => choice === "withhold");
  const outcome = allGive ? "all-give" : allWithhold ? "all-withhold" : "mixed";
  const summary =
    outcome === "all-give"
      ? "All sects gave. The outer ring refills and everyone gains +1 LV."
      : outcome === "all-withhold"
        ? "All sects withheld. The leopard surges inward once."
        : "The rite divided. Give sects gain +1 RV; Withhold sects gain +1 LV.";
  const reveal = state.players.map((player) => `${player.name}: ${choices[player.id] === "give" ? "Give" : "Withhold"}`).join(", ");
  let next: GameState = addLog(
    { ...state, collectiveRite: undefined, riteResolution: { choices, outcome, summary } },
    `Collective Rite choices revealed: ${reveal}.`,
  );
  if (allGive) {
    next = refillOuter(next);
    next.players.forEach((p) => {
      next = gainLv(next, p.id, 1, `${p.name} gains 1 LV because all Give.`);
    });
    return addLog(next, "Collective Rite: all Give. Outer RV refills.");
  }
  if (allWithhold) {
    next = moveLeopard(next, "in", "Collective Rite:");
    return addLog(next, "Collective Rite: all Withhold. The leopard surges inward once.");
  }
  state.players.forEach((player) => {
    next = choices[player.id] === "give" ? gainRv(next, player.id, 1, `${player.name} Gives and gains 1 RV.`) : gainLv(next, player.id, 1, `${player.name} Withholds and gains 1 LV.`);
  });
  return addLog(next, "Collective Rite: mixed choices.");
}

function checkCollectiveRite(state: GameState): GameState {
  if (state.collectiveRite) return state;
  const outerHasRv = state.board[0].some((tile) => tile.hasRV);
  return outerHasRv ? state : startCollectiveRite(state, "The outer ring has no RV tokens. A Collective Rite begins.");
}

function addBoon(state: GameState, playerId: string, type?: RitualBoonType, id?: FollowerId | RelicId, reason = "ritual boon"): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const boonType = type ?? (Math.random() >= 0.5 ? "follower" : "relic");
  const boonId = id ?? (boonType === "follower" ? randomFollower() : randomRelic());
  let next = updatePlayer(state, playerId, (p) =>
    boonType === "follower"
      ? { ...p, followers: [...p.followers, boonId as FollowerId] }
      : { ...p, relics: [...p.relics, boonId as RelicId] },
  );
  next = addLog(next, `${player.name} gains ${boonType === "follower" ? followerName(boonId as FollowerId) : relicName(boonId as RelicId)} as a ${reason}.`);
  return enforceBoonLimit(next, playerId, boonType);
}

function enforceBoonLimit(state: GameState, playerId: string, type: RitualBoonType): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const limit = type === "follower" ? (player.sacredItem === "bound-scroll" ? 3 : 2) : 2;
  const list = type === "follower" ? player.followers : player.relics;
  if (list.length <= limit) return state;
  if (player.isAI) return removeBoon(addLog(state, `${player.name} has too many ${type}s and discards the oldest.`), playerId, type, list[0], false);
  return { ...state, pendingDiscard: { playerId, type } };
}

function removeBoon(state: GameState, playerId: string, type: RitualBoonType, boonId: FollowerId | RelicId, log = true): GameState {
  const name = type === "follower" ? followerName(boonId as FollowerId) : relicName(boonId as RelicId);
  const next = updatePlayer(state, playerId, (p) =>
    type === "follower"
      ? { ...p, followers: removeOne(p.followers, boonId as FollowerId) }
      : { ...p, relics: removeOne(p.relics, boonId as RelicId) },
  );
  return log ? addLog(next, `${playerName(state, playerId)} discards ${name}.`) : next;
}

function gainRv(state: GameState, playerId: string, amount: number, reason: string): GameState {
  if (amount <= 0) return addLog(state, reason);
  const player = state.players.find((p) => p.id === playerId)!;
  let extra = 0;
  if (player.followers.includes("acolyte") && !player.uses.acolyteTurn) extra = 1;
  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    rv: p.rv + amount + extra,
    uses: { ...p.uses, acolyteTurn: p.uses.acolyteTurn || extra > 0 },
  }));
  next = addLog(next, `${reason}${extra ? " Acolyte adds +1 RV." : ""}`);
  return next;
}

function gainLv(state: GameState, playerId: string, amount: number, reason: string): GameState {
  let next = amount > 0 ? updatePlayer(state, playerId, (p) => ({ ...p, lv: p.lv + amount })) : state;
  next = addLog(next, reason);
  if (amount > 0) next = checkCultTitle(next, playerId);
  const player = next.players.find((p) => p.id === playerId)!;
  if (amount > 0) {
    next.players
      .filter((p) => p.id !== playerId && p.position.tier === player.position.tier && p.followers.includes("witness"))
      .forEach((witness) => {
        next = gainRv(next, witness.id, 1, `${witness.name}'s Witness interprets ${player.name}'s LV gain and grants +1 RV.`);
      });
  }
  return checkLegendaryVictory(next, playerId);
}

function checkCultTitle(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const title = cultTitleForLv(player.lv);
  if (!title || (player.uses.cultTitleLevel ?? 0) >= title.level) return state;
  let next = updatePlayer(state, playerId, (p) => ({ ...p, uses: { ...p.uses, cultTitleLevel: title.level } }));
  next = addLog(next, `${player.name} becomes ${title.name}: ${title.text}`);
  return addNotification(next, {
    title: `${player.name}: ${title.name}`,
    body: title.text,
    kind: "info",
  });
}

function checkLegendaryVictory(state: GameState, playerId: string): GameState {
  if (state.gameOver) return state;
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.lv < state.legendaryVictoryThreshold) return state;
  return addLog(
    { ...state, gameOver: "legend-win", winnerId: playerId },
    `${player.name}'s legend reaches ${player.lv} LV. Their cult eclipses the temple struggle.`,
  );
}

function loseRv(state: GameState, playerId: string, amount: number, reason: string, _eventHarm = false): GameState {
  if (amount <= 0) return addLog(state, reason);
  const player = state.players.find((p) => p.id === playerId)!;
  const actual = Math.min(player.rv, amount);
  let next = updatePlayer(state, playerId, (p) => ({ ...p, rv: Math.max(0, p.rv - actual) }));
  next = addLog(next, `${reason} ${actual} RV lost.`);
  if (actual > 0 && player.relics.includes("cracked-chalice")) next = gainLv(next, playerId, 1, `${player.name}'s Cracked Chalice turns lost RV into +1 LV.`);
  return next;
}

function loseLv(state: GameState, playerId: string, amount: number, reason: string): GameState {
  if (amount <= 0) return addLog(state, reason);
  const player = state.players.find((p) => p.id === playerId)!;
  const actual = Math.min(player.lv, amount);
  return addLog(
    updatePlayer(state, playerId, (p) => ({ ...p, lv: Math.max(0, p.lv - actual) })),
    `${reason} ${actual} LV lost.`,
  );
}

function markTile(state: GameState, position: Position, desecrated: boolean, hasRV?: boolean): GameState {
  if (position.tier >= ALTAR_TIER) return state;
  return {
    ...state,
    board: state.board.map((tier, tierIndex) =>
      tierIndex !== position.tier
        ? tier
        : tier.map((tile) => (tile.index === position.index ? { ...tile, desecrated, hasRV: hasRV ?? tile.hasRV } : tile)),
    ),
  };
}

function refillOuter(state: GameState): GameState {
  return {
    ...state,
    board: [
      state.board[0].map((tile) => ({ ...tile, hasRV: tile.type !== "event" && tile.type !== "start" })),
      state.board[1],
      state.board[2],
    ],
  };
}

function nudgePlayer(state: GameState, playerId: string, direction: Direction | "in" | "out" | "start"): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const nextPosition = nudgePosition(player.position, direction);
  if (nextPosition.tier >= ALTAR_TIER) return addLog({ ...state, gameOver: "players-win", winnerId: playerId }, `${player.name} is moved into the altar by playtest control.`);
  let next = updatePlayer(state, playerId, (p) => ({ ...p, position: nextPosition }));
  if (direction === "start") {
    next = addNotification(addLog(next, `${player.name} was moved to Start by Playtest Mode.`), {
      title: `${player.name} returned to Start`,
      body: "Playtest Mode manually moved this player back to the starting tile.",
      kind: "return",
    });
  }
  return handleLanding(next, playerId);
}

function nudgePosition(position: Position, direction: Direction | "in" | "out" | "start"): Position {
  if (direction === "start") return { ...START };
  const len = tierLength(position.tier);
  if (direction === "cw") return { ...position, index: (position.index + 1) % len };
  if (direction === "ccw") return { ...position, index: (position.index - 1 + len) % len };
  if (direction === "in") {
    if (position.tier >= INNER_TIER) return { tier: ALTAR_TIER, index: 0 };
    return { tier: position.tier + 1, index: mapIndex(position.index, tierLength(position.tier), tierLength(position.tier + 1)) };
  }
  if (position.tier <= 0) return { tier: 0, index: position.index };
  return { tier: position.tier - 1, index: mapIndex(position.index, tierLength(position.tier), tierLength(position.tier - 1)) };
}

function rotateSecondTier(state: GameState, steps: number): GameState {
  const tier = state.board[1];
  const len = tier.length;
  const normalized = ((steps % len) + len) % len;
  const rotated = [...tier.slice(len - normalized), ...tier.slice(0, len - normalized)].map((tile, index) => ({
    ...tile,
    index,
    id: `1-${index}`,
  }));
  return { ...state, board: [state.board[0], rotated, state.board[2]] };
}

function updatePlayer(state: GameState, playerId: string, updater: (player: Player) => Player): GameState {
  return { ...state, players: state.players.map((player) => (player.id === playerId ? updater(player) : player)) };
}

function replaceCurrentPlayer(state: GameState, player: Player): GameState {
  return { ...state, players: state.players.map((p, index) => (index === state.currentPlayerIndex ? player : p)) };
}

function isAdjacent(a: Position, b: Position): boolean {
  if (b.tier >= ALTAR_TIER || a.tier !== b.tier) return false;
  return distanceOnRing(a.index, b.index, tierLength(a.tier)) <= 1;
}

function gateCostForTier(state: GameState, tier: number): number {
  return tier <= 0 ? state.gateCosts[0] : state.gateCosts[1];
}

function payGateCost(player: Player, cost: number): { rv: number; lv: number } {
  const rv = Math.min(player.rv, cost);
  const remaining = Math.max(0, cost - rv);
  return { rv, lv: Math.ceil(remaining / 2) };
}

function distanceOnRing(a: number, b: number, len: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, len - raw);
}

function mapIndex(index: number, fromLength: number, toLength: number): number {
  return Math.round((index / fromLength) * toLength) % toLength;
}

function randomCardId(): EventCardId {
  return EVENT_CARDS[Math.floor(Math.random() * EVENT_CARDS.length)].id;
}

function randomFollower(): FollowerId {
  return FOLLOWERS[Math.floor(Math.random() * FOLLOWERS.length)].id;
}

function randomRelic(): RelicId {
  return RELICS[Math.floor(Math.random() * RELICS.length)].id;
}

function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function challengeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function removeOne<T>(list: T[], item: T): T[] {
  const index = list.indexOf(item);
  return index < 0 ? list : [...list.slice(0, index), ...list.slice(index + 1)];
}

function playerName(state: GameState, playerId: string): string {
  return state.players.find((player) => player.id === playerId)?.name ?? "Player";
}

function addLog(state: GameState, text: string): GameState {
  return { ...state, log: [logEntry(text), ...state.log].slice(0, 100) };
}

function addNotification(
  state: GameState,
  notification: Omit<GameNotification, "id">,
): GameState {
  return {
    ...state,
    notifications: [notificationEntry(notification), ...(state.notifications ?? [])].slice(0, 4),
  };
}

function logEntry(text: string): GameLogEntry {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text };
}

function notificationEntry(notification: Omit<GameNotification, "id">): GameNotification {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...notification,
  };
}

function describeSteps(steps: number): string {
  return steps >= 0 ? `clockwise ${steps}` : `counterclockwise ${Math.abs(steps)}`;
}

function directionLabel(direction: Direction | "in" | "out" | "start"): string {
  if (direction === "cw") return "clockwise";
  if (direction === "ccw") return "counterclockwise";
  if (direction === "in") return "inward";
  if (direction === "out") return "outward";
  return "to start";
}

function tierName(tier: number): string {
  if (tier === 0) return "the outer level";
  if (tier === 1) return "the middle level";
  if (tier === 2) return "the inner level";
  return "the altar";
}

function cultTitleForLv(lv: number): { level: number; name: string; text: string } | undefined {
  if (lv >= 15) return { level: 15, name: "Eclipsing Faith", text: "Their cult can now rival the meaning of the altar itself." };
  if (lv >= 10) return { level: 10, name: "Living Myth", text: "Their ordeals are now repeated as sacred story." };
  if (lv >= 6) return { level: 6, name: "Marked Cult", text: "Followers begin reading every accident as a sign." };
  if (lv >= 3) return { level: 3, name: "Whispered Sect", text: "Their name starts circulating beyond the outer court." };
  return undefined;
}

function personalityName(personality?: Player["aiPersonality"]): string {
  if (personality === "pilgrim") return "Pilgrim";
  if (personality === "martyr") return "Martyr";
  if (personality === "steward") return "Steward";
  if (personality === "trickster") return "Trickster";
  return "Rival";
}
