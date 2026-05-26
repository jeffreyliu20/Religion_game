import { GameState } from "../types";

type Props = {
  state: GameState;
};

export default function EndGameRecap({ state }: Props) {
  if (!state.gameOver) return null;

  const winner = state.players.find((player) => player.id === state.winnerId);
  const title =
    state.gameOver === "players-win"
      ? "Altar Victory"
      : state.gameOver === "legend-win"
        ? "Legend Victory"
        : "Leopard Victory";

  return (
    <section className="panel end-recap">
      <div className="panel-header">
        <h2>End Recap</h2>
        <span>{title}</span>
      </div>
      <p>
        {winner
          ? `${winner.name} ends with ${winner.rv} RV, ${winner.lv} LV, ${winner.gatesPaid}/2 gate judgments passed, ${winner.followers.length} followers, and ${winner.relics.length} relics.`
          : `The leopard reached the altar ${state.leopardVisits} times and overtook the ritual.`}
      </p>
      <div className="recap-grid">
        {state.players.map((player) => (
          <div key={player.id}>
            <strong>{player.name}</strong>
            <span>{cultTitle(player.lv) ?? "No cult title"}</span>
            <span>{player.rv} RV / {player.lv} LV</span>
            <span>{player.gatesPaid}/2 gate judgments passed</span>
            <span>D{player.movementDie} movement{player.leopardWard ? " / ward unused" : ""}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function cultTitle(lv: number): string | undefined {
  if (lv >= 15) return "Eclipsing Faith";
  if (lv >= 10) return "Living Myth";
  if (lv >= 6) return "Marked Cult";
  if (lv >= 3) return "Whispered Sect";
  return undefined;
}
