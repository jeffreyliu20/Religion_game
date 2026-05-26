import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

export default function RulesPanel() {
  const [open, setOpen] = useState(true);

  return (
    <section className="panel rules-panel">
      <button className="rules-toggle" onClick={() => setOpen(!open)}>
        <BookOpen size={17} />
        <span>Rules & Ritual Reading</span>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {open && (
        <div className="rules-body">
          <p>
            This game treats ritual as a structure for making meaning under unstable conditions. Players try
            to make their sacred items significant through repeated movement, sacrifice, followers, relics,
            and advancement through sacred boundaries. But the leopard, rotating temple, divine interventions,
            and collective rites constantly interrupt the ritual order.
          </p>
          <p>
            The leopard is not simply an enemy. Like Smith's reading of ritual intrusion, it represents an
            accidental disruption that can become meaningful through repetition. If the leopard reaches the
            altar enough times, it becomes the sacred object instead of the players' items. The game should
            therefore show that ritual does not compel the world; it organizes and contests meaning in a world
            that keeps breaking into the sacred space.
          </p>
          <div className="rules-columns">
            <ul>
              <li>3-6 human or AI sects begin with one Sacred Item.</li>
              <li>Roll D4 for player movement.</li>
              <li>Move clockwise or counterclockwise along the current tier.</li>
              <li>Collect RV, cleanse Desecrated tiles, and gain Ritual Boons.</li>
              <li>Event tiles draw from the same 10 Divine Intervention cards.</li>
            </ul>
            <ul>
              <li>Gate costs are 5, then 7 Divinity Points.</li>
              <li>Gate sacrifice spends RV first, then LV.</li>
              <li>Followers and Relics are capped at 2 each.</li>
              <li>D10 moves the leopard after each turn: 1-2 clockwise, 3-4 counterclockwise, 5-7 outward, 8-9 stalk, 10 inward.</li>
              <li>The leopard eats at most one unprotected adjacent sect per movement.</li>
              <li>Leopard movement desecrates tiles and can feed the ritual economy.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
