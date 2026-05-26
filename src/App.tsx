import { useEffect, useMemo, useReducer } from "react";
import { RotateCcw } from "lucide-react";
import { BALANCE_VERSION, DEFAULT_LEGENDARY_VICTORY_THRESHOLD, DEFAULT_LEOPARD_LOSS_THRESHOLD, reducer, emptyState } from "./game";
import Board from "./components/Board";
import EventDeck from "./components/EventDeck";
import GameLog from "./components/GameLog";
import PlayerPanel from "./components/PlayerPanel";
import RulesPanel from "./components/RulesPanel";
import SetupPanel from "./components/SetupPanel";
import TurnPrompt from "./components/TurnPrompt";
import { AiPersonality, GameState } from "./types";
import CollectiveRiteModal from "./components/CollectiveRiteModal";
import DiscardBoonModal from "./components/DiscardBoonModal";
import Notifications from "./components/Notifications";
import ChallengeModal from "./components/ChallengeModal";
import EndGameRecap from "./components/EndGameRecap";

const STORAGE_KEY = "gaming-the-gods-state";
const AI_PERSONALITIES: AiPersonality[] = ["pilgrim", "martyr", "steward", "trickster"];

function loadState(): GameState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyState();
  try {
    const parsed = JSON.parse(saved) as GameState;
    if (!Array.isArray(parsed.board) || parsed.board.length < 3) return emptyState();
    const savedBalanceVersion = parsed.balanceVersion ?? 1;
    const leopardLossThreshold =
      savedBalanceVersion < BALANCE_VERSION && (parsed.leopardLossThreshold ?? 3) <= 3
        ? DEFAULT_LEOPARD_LOSS_THRESHOLD
        : parsed.leopardLossThreshold ?? DEFAULT_LEOPARD_LOSS_THRESHOLD;
    const gameOver =
      parsed.collectiveRite || (parsed.gameOver === "leopard-win" && (parsed.leopardVisits ?? 0) < leopardLossThreshold)
        ? undefined
        : parsed.gameOver;
    const legendaryVictoryThreshold =
      savedBalanceVersion < BALANCE_VERSION && (parsed.legendaryVictoryThreshold ?? 15) === 18
        ? DEFAULT_LEGENDARY_VICTORY_THRESHOLD
        : parsed.legendaryVictoryThreshold ?? DEFAULT_LEGENDARY_VICTORY_THRESHOLD;
    const legendWinner = !gameOver ? parsed.players.find((player) => player.lv >= legendaryVictoryThreshold) : undefined;
    return {
      ...parsed,
      balanceVersion: BALANCE_VERSION,
      leopardLossThreshold,
      legendaryVictoryThreshold,
      gameOver: legendWinner ? "legend-win" : gameOver,
      winnerId: legendWinner ? legendWinner.id : gameOver ? parsed.winnerId : undefined,
      gateCosts: parsed.gateCosts ?? [5, 7],
      turnRolled: parsed.turnRolled ?? (parsed.pendingMove ?? 0) > 0,
      notifications: parsed.notifications ?? [],
      pendingChallenge: parsed.pendingChallenge?.kind ? parsed.pendingChallenge : undefined,
      board: parsed.board.map((tier) => tier.map((tile) => ({ ...tile, desecrated: tile.desecrated ?? false }))),
      players: parsed.players.map((player, index) => ({
        ...player,
        isAI: player.isAI ?? index > 0,
        sacredItem: player.sacredItem ?? ["sacred-chalice", "temple-knife", "olive-idol", "funeral-mask", "bronze-bell", "bound-scroll"][index % 6],
        followers: player.followers ?? [],
        relics: player.relics ?? [],
        enteredTiers: player.enteredTiers ?? [player.position?.tier ?? 0],
        uses: player.uses ?? {},
        movementDie: player.movementDie ?? 4,
        leopardWard: player.leopardWard ?? false,
        aiPersonality: player.aiPersonality ?? (player.isAI ? AI_PERSONALITIES[index % AI_PERSONALITIES.length] : undefined),
      })),
    };
  } catch {
    return emptyState();
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const currentPlayer = useMemo(
    () => state.players[state.currentPlayerIndex],
    [state.players, state.currentPlayerIndex],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.setupComplete || state.gameOver || state.collectiveRite || state.riteResolution || state.pendingDiscard || state.pendingChallenge || !currentPlayer?.isAI) return;
    const timeout = window.setTimeout(() => dispatch({ type: "AI_TURN" }), 850);
    return () => window.clearTimeout(timeout);
  }, [state.setupComplete, state.gameOver, state.collectiveRite, state.riteResolution, state.pendingDiscard, state.pendingChallenge, state.currentPlayerIndex, state.log.length, currentPlayer?.isAI]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Digital playtest aid</p>
          <h1>Gaming the Gods</h1>
          <p className="subtitle">The Temple Game: ritual movement, sacred gates, divine interruption.</p>
        </div>
        <div className="header-actions">
          <button className="ghost-button" onClick={() => dispatch({ type: "TOGGLE_PLAYTEST" })}>
            {state.playtestMode ? "Hide Playtest" : "Playtest Mode"}
          </button>
          <button className="danger-button" onClick={() => dispatch({ type: "RESET" })}>
            <RotateCcw size={16} />
            Reset Game
          </button>
        </div>
      </header>

      {!state.setupComplete ? (
        <SetupPanel onStart={(playerCount, names, aiPlayers, sacredItems) => dispatch({ type: "NEW_GAME", playerCount, names, aiPlayers, sacredItems })} />
      ) : (
        <>
          <section className="status-strip">
            <div>
              <span>Turn</span>
              <strong>{currentPlayer?.name}</strong>
            </div>
            <div>
              <span>Pending Move</span>
              <strong>{state.pendingMove}</strong>
            </div>
            <div>
              <span>Leopard Altar Visits</span>
              <strong>{state.leopardVisits}/{state.leopardLossThreshold}</strong>
            </div>
            <div>
              <span>Legend Victory</span>
              <strong>{state.legendaryVictoryThreshold} LV</strong>
            </div>
            <div>
              <span>Gate Costs</span>
              <strong>{state.gateCosts[0]} / {state.gateCosts[1]}</strong>
            </div>
            <div>
              <span>Last Rolls</span>
              <strong>D4 {state.lastRolls.d4 ?? "-"} / D10 {state.lastRolls.d10 ?? "-"}</strong>
            </div>
          </section>

          {state.gameOver && (
            <section className={`end-banner ${state.gameOver}`}>
              {state.gameOver === "players-win"
                ? `${state.players.find((player) => player.id === state.winnerId)?.name} wins at the altar.`
                : state.gameOver === "legend-win"
                  ? `${state.players.find((player) => player.id === state.winnerId)?.name}'s cult eclipses all others.`
                  : "Collective loss: the leopard becomes the sacred object."}
            </section>
          )}

          <TurnPrompt state={state} />
          <Notifications notifications={state.notifications} dispatch={dispatch} />
          <EndGameRecap state={state} />

          <div className="workspace-grid">
            <section className="board-zone">
              <Board state={state} dispatch={dispatch} />
            </section>
            <aside className="side-zone">
              <PlayerPanel state={state} dispatch={dispatch} />
              <EventDeck state={state} dispatch={dispatch} />
              <RulesPanel />
              <GameLog entries={state.log} />
            </aside>
          </div>
          {state.pendingChallenge && <ChallengeModal state={state} dispatch={dispatch} />}
          {(state.collectiveRite || state.riteResolution) && <CollectiveRiteModal state={state} dispatch={dispatch} />}
          {state.pendingDiscard && <DiscardBoonModal state={state} dispatch={dispatch} />}
        </>
      )}
    </main>
  );
}
