import { FormEvent, useState } from "react";
import { SACRED_ITEMS } from "../data/ritual";
import { SacredItemId } from "../types";

type SetupPanelProps = {
  onStart: (playerCount: number, names: string[], aiPlayers: boolean[], sacredItems: SacredItemId[]) => void;
};

export default function SetupPanel({ onStart }: SetupPanelProps) {
  const [playerCount, setPlayerCount] = useState(3);
  const [names, setNames] = useState(["Red Sect", "Blue Sect", "Green Sect", "Gold Sect", "Violet Sect", "Teal Sect"]);
  const [aiPlayers, setAiPlayers] = useState([false, true, true, true, true, true]);
  const [sacredItems, setSacredItems] = useState<SacredItemId[]>([
    "sacred-chalice",
    "temple-knife",
    "olive-idol",
    "funeral-mask",
    "bronze-bell",
    "bound-scroll",
  ]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onStart(playerCount, names.slice(0, playerCount), aiPlayers.slice(0, playerCount), sacredItems.slice(0, playerCount));
  }

  return (
    <section className="setup-panel">
      <div className="setup-copy">
        <p className="eyebrow">New Game</p>
        <h2>Prepare the outer court</h2>
        <p>
          Choose 3-6 sects. Everyone begins at the start tile while the leopard waits at the temple edge.
          Make one or more sects human and let AI rivals resolve their own turns.
        </p>
      </div>

      <form className="setup-form" onSubmit={submit}>
        <label>
          Players
          <input
            type="number"
            min={3}
            max={6}
            value={playerCount}
            onChange={(event) => setPlayerCount(Number(event.target.value))}
          />
        </label>

        <div className="name-grid">
          {Array.from({ length: playerCount }, (_, index) => (
            <label key={index} className="sect-setup-row">
              <span>Sect {index + 1}</span>
              <input
                value={names[index]}
                placeholder={`Sect ${index + 1}`}
                onChange={(event) => {
                  const next = [...names];
                  next[index] = event.target.value;
                  setNames(next);
                }}
              />
              <button
                type="button"
                className={aiPlayers[index] ? "mode-pill ai" : "mode-pill human"}
                onClick={() => {
                  const next = [...aiPlayers];
                  next[index] = !next[index];
                  setAiPlayers(next);
                }}
              >
                {aiPlayers[index] ? "AI Rival" : "Human"}
              </button>
              <select
                value={sacredItems[index]}
                onChange={(event) => {
                  const next = [...sacredItems];
                  next[index] = event.target.value as SacredItemId;
                  setSacredItems(next);
                }}
              >
                {SACRED_ITEMS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small className="setup-item-note">
                {SACRED_ITEMS.find((item) => item.id === sacredItems[index])?.text}
              </small>
            </label>
          ))}
        </div>

        <button className="primary-button" type="submit">
          Begin Ritual
        </button>
      </form>
    </section>
  );
}
