import { GameAction } from "../game";
import { GameState } from "../types";
import HelpTooltip from "./HelpTooltip";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export default function CollectiveRiteModal({ state, dispatch }: Props) {
  if (state.riteResolution) {
    const resolution = state.riteResolution;
    return (
      <div className="modal-backdrop">
        <section className="modal-panel">
          <p className="eyebrow">Collective Rite Revealed</p>
          <h2>{outcomeTitle(resolution.outcome)}</h2>
          <p>{resolution.summary}</p>
          <div className="rite-choice-list">
            {state.players.map((player) => (
              <div key={player.id} className="rite-choice-row revealed-choice-row">
                <strong>{player.name}</strong>
                <span className={`revealed-choice ${resolution.choices[player.id]}`}>
                  {resolution.choices[player.id] === "give" ? "Give" : "Withhold"}
                </span>
              </div>
            ))}
          </div>
          <button className="primary-button full-width" onClick={() => dispatch({ type: "DISMISS_RITE_REVEAL" })}>
            Close Rite
          </button>
        </section>
      </div>
    );
  }

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
          Each sect secretly chooses Give or Withhold. AI rivals have already locked hidden choices; human
          choices are hidden after they are locked and revealed only when the rite resolves.
        </p>
        <div className="rite-choice-list">
          {state.players.map((player) => {
            const choiceLocked = Boolean(choices[player.id]);
            return (
              <div key={player.id} className="rite-choice-row">
                <strong>{player.name}</strong>
                {choiceLocked ? (
                  <span className="locked-choice">{player.isAI ? "AI choice hidden" : "Choice locked"}</span>
                ) : (
                  <div>
                    <button onClick={() => dispatch({ type: "SET_RITE_CHOICE", playerId: player.id, choice: "give" })}>
                      Give
                    </button>
                    <button onClick={() => dispatch({ type: "SET_RITE_CHOICE", playerId: player.id, choice: "withhold" })}>
                      Withhold
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button className="primary-button full-width" disabled={!ready} onClick={() => dispatch({ type: "RESOLVE_COLLECTIVE_RITE" })}>
          Resolve Rite
        </button>
      </section>
    </div>
  );
}

function outcomeTitle(outcome: "all-give" | "mixed" | "all-withhold"): string {
  if (outcome === "all-give") return "The temple is sustained";
  if (outcome === "all-withhold") return "The temple is abandoned";
  return "The rite divides";
}
