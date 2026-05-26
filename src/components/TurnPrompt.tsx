import { Bot, Crown, Footprints, ShieldQuestion } from "lucide-react";
import { divinity, gateIndexForTier, getTile } from "../game";
import { GameState } from "../types";

type TurnPromptProps = {
  state: GameState;
};

export default function TurnPrompt({ state }: TurnPromptProps) {
  const player = state.players[state.currentPlayerIndex];
  if (!player) return null;

  const gateIndex = gateIndexForTier(state, player.position.tier);
  const hasGateToChase = gateIndex >= 0;
  const gateCost = player.position.tier === 0 ? state.gateCosts[0] : state.gateCosts[1];
  const canPassGate = divinity(player) >= gateCost;
  const isInnerLevel = player.position.tier === 2;
  const currentTile = getTile(state.board, player.position);

  let icon = <ShieldQuestion size={20} />;
  let title = `${player.name}: choose the next ritual action`;
  let body = "Roll D4, then spend movement clockwise or counterclockwise. Collect RV tokens until you can pay a gate.";

  if (state.gameOver === "players-win") {
    icon = <Crown size={20} />;
    title = "The altar has been claimed";
    body = "Start a new game or reset the current playtest to try another ritual path.";
  } else if (state.gameOver === "leopard-win") {
    icon = <ShieldQuestion size={20} />;
    title = "The leopard has rewritten the ritual";
    body = `The leopard reached the altar ${state.leopardLossThreshold} times. Reset or start a new game to test a different tempo.`;
  } else if (player.isAI) {
    icon = <Bot size={20} />;
    title = `${player.name} is thinking`;
    body = "AI rivals roll, move toward useful RV or the next gate, resolve events, and end their turn automatically.";
  } else if (!state.turnRolled) {
    title = "Roll once to begin the turn";
    body = "Each player gets one D4 movement roll per turn. After rolling, spend movement, cleanse the current tile, or end the turn.";
  } else if (currentTile.desecrated) {
    title = "Desecration can become ritual value";
    body = "Use Cleanse Tile to remove desecration, restore an RV token, and gain +1 LV, or keep moving if the gate matters more.";
  } else if (state.pendingMove > 0) {
    icon = <Footprints size={20} />;
    title = `Spend ${state.pendingMove} movement`;
    body = isInnerLevel
      ? `Move toward the inner altar gate at tile ${gateIndex}. If both judgments are passed, landing there wins.`
      : canPassGate && hasGateToChase
        ? `Move toward the gate at tile ${gateIndex}. Passing it automatically spends ${gateCost} Divinity Points, RV first.`
        : `Gather RV, cleanse desecration, or land on a Divine tile. You need ${gateCost} Divinity Points to pass the next gate.`;
  } else if (state.turnRolled) {
    title = "Turn action spent";
    body = "You have no movement left. End the turn to roll leopard movement and pass play to the next sect.";
  } else if (isInnerLevel) {
    icon = <Crown size={20} />;
    title = "Final approach";
    body = `Roll D4 and reach the inner altar gate at tile ${gateIndex}. You have already paid ${player.gatesPaid}/2 judgments.`;
  } else if (canPassGate && hasGateToChase) {
    title = "You can pass a gate";
    body = `Roll D4 and head for tile ${gateIndex}. Your ${divinity(player)} Divinity Points are enough for the ${gateCost}-point sacrifice.`;
  }

  return (
    <section className="turn-prompt">
      <div className="prompt-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </section>
  );
}
