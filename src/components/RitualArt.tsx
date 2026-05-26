import type { ReactNode } from "react";
import { EventCardId, FollowerId, RelicId, SacredItemId } from "../types";

type RitualArtProps = {
  kind: "leopard" | "event" | "gate" | "sacred" | "follower" | "relic" | "desecration";
  id?: EventCardId | SacredItemId | FollowerId | RelicId | string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

export default function RitualArt({ kind, id, label, size = "md" }: RitualArtProps) {
  return (
    <span className={`ritual-art ${kind} ${size}`} aria-hidden={label ? undefined : true} title={label}>
      <svg viewBox="0 0 64 64" role="img" aria-label={label}>
        {renderArt(kind, id)}
      </svg>
    </span>
  );
}

function renderArt(kind: RitualArtProps["kind"], id?: RitualArtProps["id"]): ReactNode {
  if (kind === "leopard") return leopard();
  if (kind === "event") return eventGlyph(id);
  if (kind === "gate") return gate();
  if (kind === "desecration") return desecration();
  if (kind === "sacred") return sacredItem(id as SacredItemId);
  if (kind === "follower") return follower(id as FollowerId);
  return relic(id as RelicId);
}

function baseAura() {
  return (
    <>
      <circle cx="32" cy="32" r="29" className="art-aura" />
      <circle cx="32" cy="32" r="22" className="art-inner" />
    </>
  );
}

function leopard() {
  return (
    <>
      <circle cx="32" cy="32" r="30" fill="#171717" />
      <path d="M17 40c3-14 13-22 27-20 8 1 12 7 10 16-2 10-12 16-23 14-8-1-13-5-14-10Z" fill="#d7a948" />
      <path d="M20 38c3-9 10-15 20-14 6 1 10 5 9 11-2 7-9 11-17 10-7-1-11-4-12-7Z" fill="#f6d26f" />
      <path d="M43 20l8-8 3 11M21 25l-8-4 2 11" fill="#d7a948" />
      <circle cx="30" cy="31" r="2.4" fill="#171717" />
      <circle cx="41" cy="30" r="2.2" fill="#171717" />
      <circle cx="26" cy="39" r="2" fill="#171717" />
      <circle cx="37" cy="40" r="2.6" fill="#171717" />
      <circle cx="47" cy="35" r="1.8" fill="#171717" />
      <path d="M48 42c6 2 9 5 10 9" stroke="#d7a948" strokeWidth="4" strokeLinecap="round" fill="none" />
    </>
  );
}

function eventGlyph(id?: RitualArtProps["id"]) {
  const rays = id === "test-of-faith" || id === "trial-of-the-blind";
  return (
    <>
      {baseAura()}
      <path d="M10 32c8-10 15-15 22-15s14 5 22 15c-8 10-15 15-22 15s-14-5-22-15Z" className="art-primary" />
      <circle cx="32" cy="32" r="8" className="art-light" />
      <circle cx="32" cy="32" r="3" className="art-dark" />
      {rays && (
        <>
          <path d="M32 5v9M32 50v9M5 32h9M50 32h9" className="art-stroke" />
          <path d="M13 13l6 6M45 45l6 6M51 13l-6 6M19 45l-6 6" className="art-stroke" />
        </>
      )}
    </>
  );
}

function gate() {
  return (
    <>
      {baseAura()}
      <path d="M18 51V24c0-8 6-14 14-14s14 6 14 14v27" className="art-primary" />
      <path d="M24 51V26c0-5 3-8 8-8s8 3 8 8v25" className="art-dark" />
      <path d="M14 51h36M18 28h28" className="art-stroke-light" />
    </>
  );
}

function desecration() {
  return (
    <>
      <circle cx="32" cy="32" r="28" fill="#32155a" />
      <path d="M19 46c1-11 4-18 12-28 9 11 13 19 14 28-8-5-17-5-26 0Z" fill="#8b5cf6" />
      <path d="M25 29l7 8 8-15" stroke="#f5d0fe" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

function sacredItem(id?: SacredItemId) {
  if (id === "temple-knife") return knife();
  if (id === "olive-idol") return oliveIdol();
  if (id === "funeral-mask") return mask();
  if (id === "bronze-bell") return bell();
  if (id === "bound-scroll") return scroll();
  return chalice();
}

function chalice() {
  return (
    <>
      {baseAura()}
      <path d="M20 12h24l-3 21c-1 6-5 10-9 10s-8-4-9-10L20 12Z" className="art-primary" />
      <path d="M32 43v11M22 55h20" className="art-stroke-light" />
      <path d="M23 18h18" className="art-stroke-light" />
    </>
  );
}

function knife() {
  return (
    <>
      {baseAura()}
      <path d="M40 7l8 8-24 29-8-8L40 7Z" className="art-light" />
      <path d="M19 39l6 6-8 10-8-8 10-8Z" className="art-primary" />
      <path d="M37 14l5 5" className="art-stroke" />
    </>
  );
}

function oliveIdol() {
  return (
    <>
      {baseAura()}
      <path d="M32 10c8 0 14 7 14 17 0 12-6 24-14 24S18 39 18 27c0-10 6-17 14-17Z" className="art-primary" />
      <path d="M24 27c7-10 15-10 16 0M25 36c5 5 10 5 15 0" className="art-stroke-light" />
      <path d="M46 17c7-1 10 4 8 10-7 1-10-4-8-10Z" className="art-light" />
    </>
  );
}

function mask() {
  return (
    <>
      {baseAura()}
      <path d="M17 13c7 4 23 4 30 0 2 19-2 36-15 42C19 49 15 32 17 13Z" className="art-primary" />
      <path d="M23 30c4-3 7-3 10 0M31 30c4-3 7-3 10 0M28 43h8" className="art-stroke-light" />
    </>
  );
}

function bell() {
  return (
    <>
      {baseAura()}
      <path d="M20 45h24l-4-7V25c0-7-3-12-8-12s-8 5-8 12v13l-4 7Z" className="art-primary" />
      <circle cx="32" cy="49" r="4" className="art-light" />
      <path d="M24 45h16M28 13h8" className="art-stroke-light" />
    </>
  );
}

function scroll() {
  return (
    <>
      {baseAura()}
      <path d="M19 16h25c-4 3-4 8 0 11v22H19V16Z" className="art-primary" />
      <path d="M44 16c6 0 6 11 0 11" className="art-light" />
      <path d="M24 27h13M24 35h13M24 43h9" className="art-stroke-light" />
    </>
  );
}

function follower(id?: FollowerId) {
  if (id === "witness") return eventGlyph("cooperation");
  if (id === "mourner") return tear();
  if (id === "scribe") return quill();
  if (id === "gatekeeper") return gate();
  if (id === "oracle") return oracle();
  return candle();
}

function candle() {
  return (
    <>
      {baseAura()}
      <path d="M27 30h10v21H27z" className="art-primary" />
      <path d="M32 9c7 8 6 15 0 20-6-5-7-12 0-20Z" className="art-light" />
      <path d="M24 51h16" className="art-stroke-light" />
    </>
  );
}

function tear() {
  return (
    <>
      {baseAura()}
      <path d="M32 9c10 13 16 23 16 32 0 9-7 15-16 15s-16-6-16-15c0-9 6-19 16-32Z" className="art-primary" />
      <path d="M25 42c2 4 6 6 11 5" className="art-stroke-light" />
    </>
  );
}

function quill() {
  return (
    <>
      {baseAura()}
      <path d="M49 9C34 12 23 22 16 49c18-6 28-18 33-40Z" className="art-primary" />
      <path d="M18 50c9-11 18-21 28-31M24 37l11 4M28 29l10 4" className="art-stroke-light" />
    </>
  );
}

function oracle() {
  return (
    <>
      {baseAura()}
      <path d="M32 7l6 17 18 1-14 11 5 18-15-10-15 10 5-18L8 25l18-1 6-17Z" className="art-primary" />
      <circle cx="32" cy="32" r="6" className="art-light" />
    </>
  );
}

function relic(id?: RelicId) {
  if (id === "olive-branch") return branch();
  if (id === "bronze-mirror") return mirror();
  if (id === "knotted-cord") return cord();
  if (id === "ash-bowl") return bowl();
  if (id === "leopard-tooth") return tooth();
  return crackedChalice();
}

function crackedChalice() {
  return (
    <>
      {chalice()}
      <path d="M31 15l-4 9 7 5-5 10" className="art-crack" />
    </>
  );
}

function branch() {
  return (
    <>
      {baseAura()}
      <path d="M16 48c15-12 24-23 31-36" className="art-stroke-light thick" />
      <path d="M24 40c-9 1-12-5-10-11 8-1 12 4 10 11ZM33 31c-8 0-11-5-8-11 8 0 11 5 8 11ZM41 21c-7 0-9-4-7-9 7 0 9 4 7 9Z" className="art-primary" />
    </>
  );
}

function mirror() {
  return (
    <>
      {baseAura()}
      <ellipse cx="32" cy="27" rx="15" ry="19" className="art-primary" />
      <ellipse cx="32" cy="27" rx="9" ry="12" className="art-light" />
      <path d="M32 46v10M25 56h14" className="art-stroke-light" />
    </>
  );
}

function cord() {
  return (
    <>
      {baseAura()}
      <path d="M16 33c8-15 23 15 32 0M16 33c8 15 23-15 32 0" className="art-stroke-light thick" />
      <circle cx="32" cy="33" r="7" className="art-primary" />
    </>
  );
}

function bowl() {
  return (
    <>
      {baseAura()}
      <path d="M17 31h30c-1 13-7 21-15 21s-14-8-15-21Z" className="art-primary" />
      <path d="M23 24c-3-5 4-7 1-12M33 24c-3-5 4-7 1-12M43 24c-3-5 4-7 1-12" className="art-stroke-light" />
    </>
  );
}

function tooth() {
  return (
    <>
      {baseAura()}
      <path d="M24 11c12 4 20 6 21 15 1 8-7 19-13 30-6-11-14-22-13-30 0-5 2-10 5-15Z" className="art-light" />
      <path d="M29 18c3 4 7 5 12 6" className="art-crack" />
    </>
  );
}
