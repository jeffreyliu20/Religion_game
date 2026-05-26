import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus } from "lucide-react";
import { GameAction, gatePower } from "../game";
import { FOLLOWERS, RELICS, SACRED_ITEMS, followerName, relicName, sacredItemName } from "../data/ritual";
import { FollowerId, GameState, RelicId, SacredItemId } from "../types";
import RitualArt from "./RitualArt";
import HelpTooltip from "./HelpTooltip";

type PlayerPanelProps = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export default function PlayerPanel({ state, dispatch }: PlayerPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sects</h2>
        <span>{state.players.length} players</span>
      </div>
      <div className="player-list">
        {state.players.map((player, index) => (
          <article key={player.id} className={`player-card ${index === state.currentPlayerIndex ? "active" : ""}`}>
            <div className="player-heading">
              <span className="large-marker" style={{ background: player.color }}>
                {player.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h3>{player.name}</h3>
                <p>
                  <span className={`role-badge ${player.isAI ? "ai" : "human"}`}>{player.isAI ? "AI" : "Human"}</span>
                  {player.aiPersonality && <span>{personalityName(player.aiPersonality)}</span>}
                  <span>Tier {player.position.tier + 1}, tile {player.position.index}</span>
                  <span>
                    Gate judgments {player.gatesPaid}/2
                    <HelpTooltip label={`${player.name} gate judgments help`}>
                      <strong>Gate judgments</strong>
                      <span>Each sect must pass two sacred boundaries before it can win at the altar. This tracks how many gate costs this sect has already paid.</span>
                      <span>If a sect is sent back to Start, paid judgments stay paid.</span>
                    </HelpTooltip>
                  </span>
                  <span>D{player.movementDie ?? 4}</span>
                  {player.leopardWard && <span>Ward</span>}
                  {cultTitle(player.lv) && <span>{cultTitle(player.lv)}</span>}
                </p>
              </div>
            </div>
            <div className="stat-grid">
              <span>RV <strong>{player.rv}</strong></span>
              <span>LV <strong>{player.lv}</strong></span>
              <span>Gate Power <strong>{gatePower(player)}</strong></span>
            </div>
            <div className="identity-stack">
              <div className="identity-row sacred-row">
                <RitualArt kind="sacred" id={player.sacredItem} size="md" label={sacredItemName(player.sacredItem)} />
                <span>
                  <strong>{sacredItemName(player.sacredItem)}</strong>
                  <HelpTooltip label={`${sacredItemName(player.sacredItem)} details`}>
                    <strong>{sacredItemName(player.sacredItem)}</strong>
                    <span>{SACRED_ITEMS.find((item) => item.id === player.sacredItem)?.text}</span>
                  </HelpTooltip>
                  <small>{SACRED_ITEMS.find((item) => item.id === player.sacredItem)?.text}</small>
                </span>
              </div>
              <div className="identity-row">
                <span className="boon-icon-strip">
                  {player.followers.length ? (
                    player.followers.map((follower, idx) => (
                      <RitualArt key={`${follower}-${idx}`} kind="follower" id={follower} size="sm" label={followerName(follower)} />
                    ))
                  ) : (
                    <span className="empty-art-slot" />
                  )}
                </span>
                <span>
                  <strong>
                    Followers {player.followers.length}/{player.sacredItem === "bound-scroll" ? 3 : 2}
                    <HelpTooltip label={`${player.name} followers help`}>
                      {player.followers.length ? (
                        player.followers.map((follower, idx) => (
                          <span key={`${follower}-tip-${idx}`}>
                            <strong>{followerName(follower)}</strong>
                            {FOLLOWERS.find((option) => option.id === follower)?.text}
                          </span>
                        ))
                      ) : (
                        <span>Followers are small ritual supporters. Gain them from gates, events, tier entry, or leopard encounters.</span>
                      )}
                    </HelpTooltip>
                  </strong>
                  <small>{player.followers.length ? player.followers.map(followerName).join(", ") : "None"}</small>
                </span>
              </div>
              <div className="identity-row">
                <span className="boon-icon-strip">
                  {player.relics.length ? (
                    player.relics.map((relic, idx) => (
                      <RitualArt key={`${relic}-${idx}`} kind="relic" id={relic} size="sm" label={relicName(relic)} />
                    ))
                  ) : (
                    <span className="empty-art-slot" />
                  )}
                </span>
                <span>
                  <strong>
                    Relics {player.relics.length}/2
                    <HelpTooltip label={`${player.name} relics help`}>
                      {player.relics.length ? (
                        player.relics.map((relic, idx) => (
                          <span key={`${relic}-tip-${idx}`}>
                            <strong>{relicName(relic)}</strong>
                            {RELICS.find((option) => option.id === relic)?.text}
                          </span>
                        ))
                      ) : (
                        <span>Relics are small sacred objects. Gain them from gates, events, tier entry, or leopard encounters.</span>
                      )}
                    </HelpTooltip>
                  </strong>
                  <small>{player.relics.length ? player.relics.map(relicName).join(", ") : "None"}</small>
                </span>
              </div>
            </div>
            <div className="boon-triggers">
              {player.sacredItem === "olive-idol" && (
                <button onClick={() => dispatch({ type: "TRIGGER_ITEM", playerId: player.id })}>Olive Idol</button>
              )}
              {player.followers.includes("oracle") && (
                <button onClick={() => dispatch({ type: "TRIGGER_FOLLOWER", playerId: player.id, follower: "oracle" })}>Oracle Reroll</button>
              )}
              {player.relics.includes("knotted-cord") && (
                <button onClick={() => dispatch({ type: "TRIGGER_RELIC", playerId: player.id, relic: "knotted-cord" })}>Knotted Cord</button>
              )}
              {player.relics.includes("olive-branch") && (
                <button onClick={() => dispatch({ type: "TRIGGER_RELIC", playerId: player.id, relic: "olive-branch" })}>Olive Branch</button>
              )}
              {player.relics.includes("bronze-mirror") && (
                <button onClick={() => dispatch({ type: "TRIGGER_RELIC", playerId: player.id, relic: "bronze-mirror" })}>Bronze Mirror</button>
              )}
              {index === state.currentPlayerIndex && !player.isAI && (
                <>
                  <button
                    disabled={Boolean(state.gameOver) || !state.turnRolled || player.lv < 2 || state.pendingMove > 0}
                    onClick={() => dispatch({ type: "RECRUIT_BOON_WITH_LV", playerId: player.id, boonType: "follower" })}
                  >
                    Recruit Follower -2 LV
                  </button>
                  <button
                    disabled={Boolean(state.gameOver) || !state.turnRolled || player.lv < 2 || state.pendingMove > 0}
                    onClick={() => dispatch({ type: "RECRUIT_BOON_WITH_LV", playerId: player.id, boonType: "relic" })}
                  >
                    Claim Relic -2 LV
                  </button>
                  <button
                    disabled={Boolean(state.gameOver) || player.lv < ((player.movementDie ?? 4) === 4 ? 3 : 5) || (player.movementDie ?? 4) >= 10}
                    onClick={() => dispatch({ type: "BUY_DIE_UPGRADE", playerId: player.id })}
                  >
                    Upgrade Die -{(player.movementDie ?? 4) === 4 ? 3 : 5} LV
                  </button>
                  <button
                    disabled={Boolean(state.gameOver) || player.lv < 2 || player.leopardWard}
                    onClick={() => dispatch({ type: "BUY_LEOPARD_WARD", playerId: player.id })}
                  >
                    Leopard Ward -2 LV
                  </button>
                </>
              )}
            </div>

            {state.playtestMode && (
              <>
                <div className="player-tools">
                  <button onClick={() => dispatch({ type: "ADJUST_PLAYER", playerId: player.id, stat: "rv", delta: 1 })}>
                    <Plus size={14} /> RV
                  </button>
                  <button onClick={() => dispatch({ type: "ADJUST_PLAYER", playerId: player.id, stat: "rv", delta: -1 })}>
                    <Minus size={14} /> RV
                  </button>
                  <button onClick={() => dispatch({ type: "ADJUST_PLAYER", playerId: player.id, stat: "lv", delta: 1 })}>
                    <Plus size={14} /> LV
                  </button>
                  <button onClick={() => dispatch({ type: "ADJUST_PLAYER", playerId: player.id, stat: "lv", delta: -1 })}>
                    <Minus size={14} /> LV
                  </button>
                  <button aria-label={`Move ${player.name} counterclockwise`} title="Move counterclockwise" onClick={() => dispatch({ type: "NUDGE_PLAYER", playerId: player.id, direction: "ccw" })}>
                    <ArrowLeft size={14} />
                  </button>
                  <button aria-label={`Move ${player.name} clockwise`} title="Move clockwise" onClick={() => dispatch({ type: "NUDGE_PLAYER", playerId: player.id, direction: "cw" })}>
                    <ArrowRight size={14} />
                  </button>
                  <button aria-label={`Move ${player.name} outward`} title="Move outward" onClick={() => dispatch({ type: "NUDGE_PLAYER", playerId: player.id, direction: "out" })}>
                    <ArrowUp size={14} />
                  </button>
                  <button aria-label={`Move ${player.name} inward`} title="Move inward" onClick={() => dispatch({ type: "NUDGE_PLAYER", playerId: player.id, direction: "in" })}>
                    <ArrowDown size={14} />
                  </button>
                  <button aria-label={`Move ${player.name} to Start`} title="Move to Start" onClick={() => dispatch({ type: "NUDGE_PLAYER", playerId: player.id, direction: "start" })}>
                    Start
                  </button>
                </div>
                <div className="playtest-selects">
                  <select
                    value={player.sacredItem}
                    onChange={(event) => dispatch({ type: "SET_SACRED_ITEM", playerId: player.id, sacredItem: event.target.value as SacredItemId })}
                  >
                    {SACRED_ITEMS.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <select onChange={(event) => event.target.value && dispatch({ type: "ADD_FOLLOWER", playerId: player.id, follower: event.target.value as FollowerId })} value="">
                    <option value="">Add Follower</option>
                    {FOLLOWERS.map((follower) => (
                      <option key={follower.id} value={follower.id}>{follower.name}</option>
                    ))}
                  </select>
                  <select onChange={(event) => event.target.value && dispatch({ type: "REMOVE_FOLLOWER", playerId: player.id, follower: event.target.value as FollowerId })} value="">
                    <option value="">Remove Follower</option>
                    {player.followers.map((follower, idx) => (
                      <option key={`${follower}-${idx}`} value={follower}>{followerName(follower)}</option>
                    ))}
                  </select>
                  <select onChange={(event) => event.target.value && dispatch({ type: "ADD_RELIC", playerId: player.id, relic: event.target.value as RelicId })} value="">
                    <option value="">Add Relic</option>
                    {RELICS.map((relic) => (
                      <option key={relic.id} value={relic.id}>{relic.name}</option>
                    ))}
                  </select>
                  <select onChange={(event) => event.target.value && dispatch({ type: "REMOVE_RELIC", playerId: player.id, relic: event.target.value as RelicId })} value="">
                    <option value="">Remove Relic</option>
                    {player.relics.map((relic, idx) => (
                      <option key={`${relic}-${idx}`} value={relic}>{relicName(relic)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </article>
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

function personalityName(personality: string): string {
  if (personality === "pilgrim") return "Pilgrim";
  if (personality === "martyr") return "Martyr";
  if (personality === "steward") return "Steward";
  if (personality === "trickster") return "Trickster";
  return "Rival";
}
