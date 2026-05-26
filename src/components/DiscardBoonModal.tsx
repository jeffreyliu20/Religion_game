import { FOLLOWERS, RELICS } from "../data/ritual";
import { GameAction } from "../game";
import { FollowerId, GameState, RelicId } from "../types";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

export default function DiscardBoonModal({ state, dispatch }: Props) {
  const pending = state.pendingDiscard;
  if (!pending) return null;
  const player = state.players.find((p) => p.id === pending.playerId);
  if (!player) return null;
  const list = pending.type === "follower" ? player.followers : player.relics;
  const options = pending.type === "follower" ? FOLLOWERS : RELICS;

  return (
    <div className="modal-backdrop">
      <section className="modal-panel">
        <p className="eyebrow">Boon Limit</p>
        <h2>{player.name} must discard one {pending.type}</h2>
        <p>Followers and relics stay intentionally small so each build remains readable at the table.</p>
        <div className="discard-list">
          {list.map((boon, index) => {
            const option = options.find((item) => item.id === boon);
            return (
              <button
                key={`${boon}-${index}`}
                onClick={() =>
                  dispatch({
                    type: "DISCARD_BOON",
                    playerId: player.id,
                    boonType: pending.type,
                    boonId: boon as FollowerId | RelicId,
                  })
                }
              >
                <strong>{option?.name ?? boon}</strong>
                <span>{option?.text}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
