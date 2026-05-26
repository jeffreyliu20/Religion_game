import { useState } from "react";
import { BadgePlus, ScrollText } from "lucide-react";
import { EVENT_CARDS, getCard } from "../data/cards";
import { GameAction } from "../game";
import { EventCardId, GameState } from "../types";
import RitualArt from "./RitualArt";
import HelpTooltip from "./HelpTooltip";

type EventDeckProps = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export default function EventDeck({ state, dispatch }: EventDeckProps) {
  const [specificCard, setSpecificCard] = useState<EventCardId>("cooperation");
  const lastCard = state.lastCardId ? getCard(state.lastCardId) : undefined;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Divine Intervention</h2>
        <span>
          10 cards
          <HelpTooltip label="Divine Intervention deck help">
            <strong>Event rule</strong>
            <span>Cards draw automatically when a player lands on a Divine tile. After any card resolves, the second tier rotates 1 tile clockwise.</span>
            <strong>Playtest Mode</strong>
            <span>Use Playtest Mode to draw a random or specific card manually.</span>
          </HelpTooltip>
        </span>
      </div>
      <button
        className="primary-button full-width"
        disabled={!state.playtestMode}
        title={state.playtestMode ? "Draw a random event card" : "Events draw automatically when a player lands on a Divine tile"}
        onClick={() => dispatch({ type: "DRAW_EVENT" })}
      >
        <ScrollText size={17} />
        {state.playtestMode ? "Draw Event Card" : "Auto-Draw From Divine Tiles"}
      </button>

      {state.playtestMode && (
        <div className="specific-card-row">
          <select value={specificCard} onChange={(event) => setSpecificCard(event.target.value as EventCardId)}>
            {EVENT_CARDS.map((card) => (
              <option key={card.id} value={card.id}>
                {card.title}
              </option>
            ))}
          </select>
          <button onClick={() => dispatch({ type: "DRAW_EVENT", cardId: specificCard })}>
            <BadgePlus size={16} />
            Draw
          </button>
        </div>
      )}

      {lastCard && (
        <article className="event-card">
          <div className="event-card-heading">
            <RitualArt kind="event" id={lastCard.id} size="lg" />
            <div>
              <p className="eyebrow">Last card</p>
              <h3>
                {lastCard.title}
                <HelpTooltip label={`${lastCard.title} card details`}>
                  <strong>{lastCard.title}</strong>
                  {lastCard.rules.map((rule) => (
                    <span key={rule}>{rule}</span>
                  ))}
                  <span>{lastCard.flavor}</span>
                </HelpTooltip>
              </h3>
            </div>
          </div>
          <ul>
            {lastCard.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="flavor">{lastCard.flavor}</p>
        </article>
      )}

      <details className="event-reference">
        <summary>Card Reference</summary>
        <div>
          {EVENT_CARDS.map((card) => (
            <span key={card.id} className="event-reference-chip">
              {card.title}
              <HelpTooltip label={`${card.title} rules`}>
                <strong>{card.title}</strong>
                {card.rules.map((rule) => (
                  <span key={rule}>{rule}</span>
                ))}
              </HelpTooltip>
            </span>
          ))}
        </div>
      </details>
    </section>
  );
}
