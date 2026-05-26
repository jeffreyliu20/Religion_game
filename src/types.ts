export type TileType = "start" | "shelter" | "normal" | "event" | "gate";

export type Position = {
  tier: number;
  index: number;
};

export type Tile = {
  id: string;
  tier: number;
  index: number;
  label: string;
  type: TileType;
  hasRV: boolean;
  desecrated: boolean;
};

export type SacredItemId =
  | "sacred-chalice"
  | "temple-knife"
  | "olive-idol"
  | "funeral-mask"
  | "bronze-bell"
  | "bound-scroll";

export type FollowerId =
  | "acolyte"
  | "witness"
  | "mourner"
  | "scribe"
  | "gatekeeper"
  | "oracle";

export type RelicId =
  | "cracked-chalice"
  | "olive-branch"
  | "bronze-mirror"
  | "knotted-cord"
  | "ash-bowl"
  | "leopard-tooth";

export type RitualBoonType = "follower" | "relic";

export type RitualUseFlags = {
  acolyteTurn?: boolean;
  oracleTurn?: boolean;
  oliveIdolRound?: boolean;
  oliveBranchRound?: boolean;
  gatekeeperGame?: boolean;
  bronzeMirrorGame?: boolean;
};

export type Player = {
  id: string;
  name: string;
  isAI: boolean;
  sacredItem: SacredItemId;
  followers: FollowerId[];
  relics: RelicId[];
  enteredTiers: number[];
  uses: RitualUseFlags;
  color: string;
  position: Position;
  rv: number;
  lv: number;
  gatesPaid: number;
};

export type EventCardId =
  | "cooperation"
  | "asceticism"
  | "collective-alms"
  | "sect-surge"
  | "test-of-faith"
  | "guiding-hand"
  | "sacrificial-rebirth"
  | "gamble"
  | "trial-of-the-blind"
  | "bound-faith";

export type EventCard = {
  id: EventCardId;
  title: string;
  rules: string[];
  flavor: string;
};

export type GameLogEntry = {
  id: string;
  text: string;
};

export type GameNotification = {
  id: string;
  title: string;
  body: string;
  kind: "return" | "warning" | "info";
};

export type LastRolls = {
  d4?: number;
  d10?: number;
};

export type CollectiveRiteChoice = "give" | "withhold";

export type CollectiveRite = {
  choices: Record<string, CollectiveRiteChoice>;
};

export type PendingDiscard = {
  playerId: string;
  type: RitualBoonType;
};

export type GameState = {
  balanceVersion: number;
  setupComplete: boolean;
  players: Player[];
  currentPlayerIndex: number;
  board: Tile[][];
  leopard: Position;
  leopardVisits: number;
  leopardLossThreshold: number;
  gateCosts: [number, number];
  pendingMove: number;
  turnRolled: boolean;
  lastRolls: LastRolls;
  lastCardId?: EventCardId;
  collectiveRite?: CollectiveRite;
  pendingDiscard?: PendingDiscard;
  playtestMode: boolean;
  gameOver?: "players-win" | "leopard-win";
  winnerId?: string;
  notifications: GameNotification[];
  log: GameLogEntry[];
};

export type Direction = "cw" | "ccw";
