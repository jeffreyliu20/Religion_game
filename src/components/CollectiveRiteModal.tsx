import { GameAction } from "../game";
import { GameState } from "../types";
import HelpTooltip from "./HelpTooltip";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export default function CollectiveRiteModal({ state, dispatch }: Props) {
  const choices = state.collectiveRite?.choices ?? {};
  const ready = state.players.every((player) => choices[player.id]);

  return (
    <div className="modal-backdrop">
      <section className="modal-panel">
        <p className="eyebrow">Collective Rite</p>
        <h2>
          The outer ring is empty
          <HelpTooltip label="Collective Rite rules">
            <strong>All Give</strong>
            <span>Refill the outer ring with RV tokens. Everyone gains +1 LV.</span>
            <strong>Mixed</strong>
            <span>Give players gain +1 RV. Withhold players gain +1 LV.</span>
            <strong>All Withhold</strong>
            <span>The leopard surges inward once.</span>
          </HelpTooltip>
        </h2>
        <p>
          Each sect chooses Give or Withhold. AI rivals have already made hidden choices; human players can
          set theirs here for playtest speed.
        </p>
        <div className="rite-choice-list">
          {state.players.map((player) => (
            <div key={player.id} className="rite-choice-row">
              <strong>{player.name}</strong>
              <div>
                <button
                  className={choices[player.id] === "give" ? "primary-button" : ""}
                  onClick={() => dispatch({ type: "SET_RITE_CHOICE", playerId: player.id, choice: "give" })}
                >
                  Give
                </button>
                <button
                  className={choices[player.id] === "withhold" ? "primary-button" : ""}
                  onClick={() => dispatch({ type: "SET_RITE_CHOICE", playerId: player.id, choice: "withhold" })}
                >
                  Withhold
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="primary-button full-width" disabled={!ready} onClick={() => dispatch({ type: "RESOLVE_COLLECTIVE_RITE" })}>
          Resolve Rite
        </button>
      </section>
    </div>
  );
}
