import type { CSSProperties } from "react";
import { Tile as TileType, Player, Position } from "../types";
import RitualArt from "./RitualArt";

type TileProps = {
  tile: TileType;
  players: Player[];
  leopard?: Position;
  style: CSSProperties;
  active?: boolean;
  danger?: boolean;
};

export default function Tile({ tile, players, leopard, style, active = false, danger = false }: TileProps) {
  const leopardHere = leopard?.tier === tile.tier && leopard.index === tile.index;

  return (
    <div
      className={`temple-tile ${tile.type} ${tile.desecrated ? "desecrated" : ""} ${active ? "active-tile" : ""} ${danger ? "danger-tile" : ""}`}
      style={style}
      title={`${tile.label} ${tile.index}`}
    >
      <span className="tile-index">{tile.index}</span>
      {(tile.type === "event" || tile.type === "gate") && (
        <RitualArt kind={tile.type === "event" ? "event" : "gate"} size="sm" />
      )}
      <span className="tile-label">{tile.label}</span>
      {tile.hasRV && <span className="rv-token" title="Ritual Value token" />}
      {tile.desecrated && (
        <span className="desecration-token" title="Desecrated tile">
          <RitualArt kind="desecration" size="sm" />
        </span>
      )}
      <div className="marker-row">
        {players.map((player) => (
          <span
            key={player.id}
            className="player-marker"
            title={player.name}
            style={{ background: player.color }}
          >
            {player.name.slice(0, 1).toUpperCase()}
          </span>
        ))}
        {leopardHere && (
          <span className="leopard-marker" title="Leopard">
            <RitualArt kind="leopard" size="sm" />
          </span>
        )}
      </div>
    </div>
  );
}
