import { GameLogEntry } from "../types";

type GameLogProps = {
  entries: GameLogEntry[];
};

export default function GameLog({ entries }: GameLogProps) {
  return (
    <section className="panel game-log">
      <div className="panel-header">
        <h2>Game Log</h2>
        <span>{entries.length}</span>
      </div>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>{entry.text}</li>
        ))}
      </ol>
    </section>
  );
}
