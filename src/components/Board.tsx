import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Dice4, Dice5, RotateCcw, RotateCw } from "lucide-react";
import { GameAction, getTile } from "../game";
import { GameState } from "../types";
import Tile from "./Tile";
import HelpTooltip from "./HelpTooltip";
import RitualArt from "./RitualArt";

type BoardProps = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

const BOARD_SIZE = 680;
const CENTER = BOARD_SIZE / 2;
const RING_RADII = [268, 168, 84];

export default function Board({ state, dispatch }: BoardProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const controlsDisabled = Boolean(currentPlayer?.isAI || state.gameOver);
  const currentTile = currentPlayer ? getTile(state.board, currentPlayer.position) : undefined;
  const rollDisabled = controlsDisabled || state.turnRolled;
  const moveDisabled = controlsDisabled || !state.turnRolled || state.pendingMove <= 0;
  const endDisabled = controlsDisabled || !state.turnRolled;
  const cleanseDisabled = controlsDisabled || !state.turnRolled || !currentTile?.desecrated;
  const currentTierName = currentPlayer ? tierName(currentPlayer.position.tier) : "Temple";

  return (
    <div className="board-panel">
      <div className="board-context">
        <div>
          <span className="eyebrow">Current position</span>
          <strong>{currentPlayer?.name ?? "No sect"}</strong>
          <p>
            {currentTierName}, tile {currentPlayer?.position.index ?? "-"}
            {currentTile ? ` - ${currentTile.label}${currentTile.desecrated ? " (Desecrated)" : ""}` : ""}
          </p>
        </div>
        <div className="board-legend" aria-label="board legend">
          <span><RitualArt kind="leopard" size="sm" /> Leopard</span>
          <span><RitualArt kind="event" size="sm" /> Divine</span>
          <span><RitualArt kind="gate" size="sm" /> Gate</span>
          <span><span className="legend-rv" /> RV</span>
          <span><RitualArt kind="desecration" size="sm" /> Desecrated</span>
        </div>
      </div>

      <div className="turn-controls" aria-label="turn controls">
        <button className="primary-button" disabled={rollDisabled} onClick={() => dispatch({ type: "ROLL_D4" })}>
          <Dice4 size={18} />
          {state.turnRolled ? "Rolled" : "Roll D4"}
        </button>
        <button disabled={moveDisabled} onClick={() => dispatch({ type: "MOVE_PLAYER", direction: "ccw" })}>
          <ArrowLeft size={17} />
          Move CCW
        </button>
        <button disabled={moveDisabled} onClick={() => dispatch({ type: "MOVE_PLAYER", direction: "cw" })}>
          <ArrowRight size={17} />
          Move CW
        </button>
        <button className="primary-button" disabled={endDisabled} onClick={() => dispatch({ type: "END_TURN" })}>
          End Turn
        </button>
        <button disabled={cleanseDisabled} onClick={() => dispatch({ type: "CLEANSE_TILE" })}>
          Cleanse Tile
        </button>
        <HelpTooltip label="Turn and leopard help">
          <strong>Turn flow</strong>
          <span>Roll D4 once, spend movement or cleanse, then End Turn.</span>
          <strong>Leopard D10</strong>
          <span>1-2 clockwise, 3-4 counterclockwise, 5-6 outward, 7 stalks, 8-10 inward.</span>
          <strong>Encounter limit</strong>
          <span>The leopard eats at most one unprotected adjacent sect each movement.</span>
        </HelpTooltip>
      </div>

      <div className="temple-board" style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
        <div className="mosaic-ring outer-ring" />
        <div className="mosaic-ring second-ring" />
        <div className="mosaic-ring inner-ring" />
        <div className="altar">
          <span>Altar</span>
          {state.leopard.tier >= 3 && <strong className="altar-leopard">L</strong>}
        </div>

        {state.board.map((tier, tierIndex) =>
          tier.map((tile) => {
            const angle = (tile.index / tier.length) * Math.PI * 2 - Math.PI / 2;
            const radius = RING_RADII[tierIndex];
            const size = tierIndex === 0 ? 68 : tierIndex === 1 ? 62 : 54;
            const x = CENTER + Math.cos(angle) * radius - size / 2;
            const y = CENTER + Math.sin(angle) * radius - size / 2;
            const players = state.players.filter(
              (player) => player.position.tier === tile.tier && player.position.index === tile.index,
            );
            const active = currentPlayer?.position.tier === tile.tier && currentPlayer.position.index === tile.index;
            const danger = isAdjacentToLeopard(tile.tier, tile.index, state.leopard);
            return (
              <Tile
                key={tile.id}
                tile={tile}
                players={players}
                leopard={state.leopard}
                active={active}
                danger={danger}
                style={{
                  width: size,
                  height: size,
                  left: x,
                  top: y,
                }}
              />
            );
          }),
        )}
      </div>

      {state.playtestMode && (
        <div className="playtest-board-controls">
          <button onClick={() => dispatch({ type: "ROTATE_SECOND", steps: -1 })}>
            <RotateCcw size={16} />
            Tier CCW
          </button>
          <button onClick={() => dispatch({ type: "ROTATE_SECOND", steps: 1 })}>
            <RotateCw size={16} />
            Tier CW
          </button>
          <button onClick={() => dispatch({ type: "ROLL_D10" })}>
            <Dice5 size={16} />
            Leopard D10
          </button>
          <button onClick={() => dispatch({ type: "MOVE_LEOPARD", direction: "out" })}>
            <ArrowUp size={16} />
            Leopard Out
          </button>
          <button onClick={() => dispatch({ type: "MOVE_LEOPARD", direction: "in" })}>
            <ArrowDown size={16} />
            Leopard In
          </button>
          <button onClick={() => dispatch({ type: "MOVE_LEOPARD", direction: "start" })}>
            Leopard Start
          </button>
          <button onClick={() => dispatch({ type: "MARK_CURRENT_TILE", desecrated: true })}>
            Mark Current Desecrated
          </button>
          <button onClick={() => dispatch({ type: "MARK_CURRENT_TILE", desecrated: false })}>
            Cleanse Current
          </button>
          <button onClick={() => dispatch({ type: "MARK_LEOPARD_TILE", desecrated: true })}>
            Mark Leopard Tile
          </button>
          <button onClick={() => dispatch({ type: "START_COLLECTIVE_RITE" })}>
            Collective Rite
          </button>
          <label className="mini-control">
            Gate 1
            <input
              type="number"
              min={0}
              value={state.gateCosts[0]}
              onChange={(event) => dispatch({ type: "SET_GATE_COST", gate: 0, cost: Number(event.target.value) })}
            />
          </label>
          <label className="mini-control">
            Gate 2
            <input
              type="number"
              min={0}
              value={state.gateCosts[1]}
              onChange={(event) => dispatch({ type: "SET_GATE_COST", gate: 1, cost: Number(event.target.value) })}
            />
          </label>
          <label className="mini-control">
            Leopard Loss
            <input
              type="number"
              min={1}
              value={state.leopardLossThreshold}
              onChange={(event) => dispatch({ type: "SET_LEOPARD_THRESHOLD", threshold: Number(event.target.value) })}
            />
          </label>
          <label className="mini-control">
            Legend Win
            <input
              type="number"
              min={1}
              value={state.legendaryVictoryThreshold}
              onChange={(event) => dispatch({ type: "SET_LEGENDARY_THRESHOLD", threshold: Number(event.target.value) })}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function isAdjacentToLeopard(tier: number, index: number, leopard: GameState["leopard"]): boolean {
  if (leopard.tier !== tier) return false;
  const len = tier === 0 ? 16 : tier === 1 ? 12 : 8;
  const raw = Math.abs(index - leopard.index);
  return Math.min(raw, len - raw) === 1;
}

function tierName(tier: number): string {
  if (tier === 0) return "Outer level";
  if (tier === 1) return "Middle level";
  if (tier === 2) return "Inner level";
  return "Altar";
}
