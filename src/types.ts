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
  cultTitleLevel?: number;
};

export type AiPersonality = "pilgrim" | "martyr" | "steward" | "trickster";

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
  movementDie: 4 | 6 | 10;
  leopardWard: boolean;
  aiPersonality?: AiPersonality;
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

export type CollectiveRiteResolution = {
  choices: Record<string, CollectiveRiteChoice>;
  outcome: "all-give" | "mixed" | "all-withhold";
  summary: string;
};

export type PendingDiscard = {
  playerId: string;
  type: RitualBoonType;
};

export type PendingChallenge = {
  id: string;
  playerId: string;
  source: "test-of-faith" | "gamble" | "trial-of-the-blind" | "leopard-encounter" | "cleansing";
  kind: "timing" | "coin" | "memory" | "runner" | "snake";
  safeLv?: number;
  safeRv?: number;
  successLv?: number;
  successRv?: number;
  failureLv?: number;
  failureRv?: number;
  boonType?: RitualBoonType;
  title: string;
  body: string;
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
  legendaryVictoryThreshold: number;
  gateCosts: [number, number];
  pendingMove: number;
  turnRolled: boolean;
  lastRolls: LastRolls;
  lastCardId?: EventCardId;
  collectiveRite?: CollectiveRite;
  riteResolution?: CollectiveRiteResolution;
  pendingDiscard?: PendingDiscard;
  pendingChallenge?: PendingChallenge;
  playtestMode: boolean;
  gameOver?: "players-win" | "legend-win" | "leopard-win";
  winnerId?: string;
  notifications: GameNotification[];
  log: GameLogEntry[];
};

export type Direction = "cw" | "ccw";
