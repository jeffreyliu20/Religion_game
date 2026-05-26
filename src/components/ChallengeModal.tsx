import { useEffect, useMemo, useState } from "react";
import { GameAction } from "../game";
import { GameState } from "../types";

type Props = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
};

type Point = { x: number; y: number };
type SnakeDirection = "Up" | "Left" | "Right" | "Down";

const MEMORY_SYMBOLS = ["Chalice", "Knife", "Idol", "Mask"];
const RUNNER_CELLS = 9;
const RUNNER_PLAYER_X = 1;
const SNAKE_SIZE = 5;

export default function ChallengeModal({ state, dispatch }: Props) {
  const challenge = state.pendingChallenge;
  const seed = useMemo(() => seededValue(challenge?.id ?? "challenge"), [challenge?.id]);

  const [position, setPosition] = useState(seed % 100);
  const [direction, setDirection] = useState(seed % 2 ? 1 : -1);
  const [finished, setFinished] = useState(false);
  const [coinPick, setCoinPick] = useState<"Sun" | "Moon" | undefined>();
  const [coinResult, setCoinResult] = useState<"Sun" | "Moon">(seed % 2 ? "Sun" : "Moon");
  const [memoryInput, setMemoryInput] = useState<string[]>([]);
  const [runnerTick, setRunnerTick] = useState(0);
  const [runnerJumping, setRunnerJumping] = useState(false);
  const [snakeDirection, setSnakeDirection] = useState<SnakeDirection>("Right");
  const [snakeHead, setSnakeHead] = useState<Point>({ x: 1, y: 2 });
  const [snakeOfferings, setSnakeOfferings] = useState<Point[]>(makeOfferings(seed));
  const [started, setStarted] = useState(false);

  const target = useMemo(() => {
    const start = 30 + (seed % 28);
    return { start, end: start + 15 };
  }, [seed]);

  const memorySequence = useMemo(() => {
    const length = 3 + (seed % 2);
    return Array.from({ length }, (_, offset) => MEMORY_SYMBOLS[(seed + offset * 2) % MEMORY_SYMBOLS.length]);
  }, [seed]);

  const runnerObstacles = useMemo(() => {
    const first = 6 + (seed % 3);
    return [first, first + 4 + (seed % 2), first + 8 + ((seed >> 2) % 2), first + 13];
  }, [seed]);

  useEffect(() => {
    if (!challenge) return;
    setPosition(seed % 100);
    setDirection(seed % 2 ? 1 : -1);
    setFinished(false);
    setCoinPick(undefined);
    setCoinResult(seed % 2 ? "Sun" : "Moon");
    setMemoryInput([]);
    setRunnerTick(0);
    setRunnerJumping(false);
    setSnakeDirection(["Right", "Down", "Left", "Up"][seed % 4] as SnakeDirection);
    setSnakeHead({ x: 1 + (seed % 2), y: 2 });
    setSnakeOfferings(makeOfferings(seed));
    setStarted(false);
  }, [challenge?.id, seed]);

  useEffect(() => {
    if (!challenge || challenge.kind !== "timing" || !started || finished) return;
    const timer = window.setInterval(() => {
      setPosition((current) => {
        const next = current + direction * (5 + (seed % 3));
        if (next >= 100) {
          setDirection(-1);
          return 100;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, 65 + (seed % 3) * 20);
    return () => window.clearInterval(timer);
  }, [challenge, direction, finished, seed, started]);

  useEffect(() => {
    if (!challenge || challenge.kind !== "runner" || !started || finished) return;
    const timer = window.setInterval(() => {
      setRunnerTick((tick) => {
        const nextTick = tick + 1;
        const collision = runnerObstacles.some((start) => start - nextTick === RUNNER_PLAYER_X);
        if (collision && !runnerJumping) resolve(false);
        else if (nextTick >= runnerObstacles[runnerObstacles.length - 1] + 2) resolve(true);
        return nextTick;
      });
    }, 245);
    return () => window.clearInterval(timer);
  }, [challenge, finished, runnerJumping, runnerObstacles, started]);

  useEffect(() => {
    if (!challenge || challenge.kind !== "snake" || !started || finished) return;
    const timer = window.setInterval(() => {
      setSnakeHead((head) => {
        const next = nextSnakeHead(head, snakeDirection);
        if (isOutOfBounds(next)) {
          resolve(false);
          return head;
        }
        setSnakeOfferings((offerings) => {
          const remaining = offerings.filter((item) => item.x !== next.x || item.y !== next.y);
          if (remaining.length === 0) resolve(true);
          return remaining;
        });
        return next;
      });
    }, 360 - (seed % 3) * 35);
    return () => window.clearInterval(timer);
  }, [challenge, finished, seed, snakeDirection, started]);

  useEffect(() => {
    if (!challenge || !started || finished) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"].includes(event.key)) {
        event.preventDefault();
      }

      if (challenge.kind === "timing" && (event.key === " " || event.key === "Enter")) {
        resolve(position >= target.start && position <= target.end);
      }

      if (challenge.kind === "runner" && (event.key === " " || event.key === "ArrowUp")) {
        setRunnerJumping(true);
        window.setTimeout(() => setRunnerJumping(false), 430);
      }

      if (challenge.kind === "snake") {
        if (event.key === "ArrowUp") setSnakeDirection("Up");
        if (event.key === "ArrowDown") setSnakeDirection("Down");
        if (event.key === "ArrowLeft") setSnakeDirection("Left");
        if (event.key === "ArrowRight") setSnakeDirection("Right");
      }

      if (challenge.kind === "memory") {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < MEMORY_SYMBOLS.length) {
          setMemoryInput((input) => input.length < memorySequence.length ? [...input, MEMORY_SYMBOLS[index]] : input);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [challenge, finished, memorySequence, position, started, target]);

  if (!challenge) return null;

  const safeText = rewardText(challenge.safeRv ?? 0, challenge.safeLv ?? 0);

  function resolve(success: boolean) {
    if (finished) return;
    setFinished(true);
    window.setTimeout(() => dispatch({ type: "RESOLVE_CHALLENGE", accepted: true, success }), 160);
  }

  const runnerVisibleObstacles = runnerObstacles.map((start) => start - runnerTick).filter((x) => x >= 0 && x < RUNNER_CELLS);

  return (
    <div className="modal-backdrop">
      <section className="modal-panel challenge-panel">
        <p className="eyebrow">Optional Ordeal</p>
        <h2>{challenge.title}</h2>
        <p>{challenge.body}</p>

        {!started && (
          <>
            <div className="tutorial-box">
              <strong>{tutorialTitle(challenge.kind)}</strong>
              <span>{tutorialBody(challenge.kind)}</span>
              <span>Safe reward: {safeText}. Risk reward: {rewardText(challenge.successRv ?? 0, challenge.successLv ?? 0)}{challenge.boonType ? " and 1 boon" : ""}.</span>
              <span>Failure reward: {rewardText(challenge.failureRv ?? 0, challenge.failureLv ?? 1)}.</span>
            </div>
            <div className="challenge-actions">
              <button disabled={finished} onClick={() => dispatch({ type: "RESOLVE_CHALLENGE", accepted: false })}>
                Take Certain Sign: {safeText}
              </button>
              <button className="primary-button" onClick={() => setStarted(true)}>
                Begin Ordeal
              </button>
            </div>
          </>
        )}

        {started && challenge.kind === "timing" && (
          <>
            <div className="omen-meter" aria-label="Omen challenge timing meter">
              <span className="omen-target" style={{ left: `${target.start}%`, width: `${target.end - target.start}%` }} />
              <span className="omen-marker" style={{ left: `${position}%` }} />
            </div>
            <p className="challenge-readout">Press Space or Enter when the marker is inside the sacred band.</p>
          </>
        )}

        {started && challenge.kind === "coin" && (
          <div className="coin-ordeal">
            {(["Sun", "Moon"] as const).map((side) => (
              <button key={side} className={coinPick === side ? "primary-button" : ""} onClick={() => setCoinPick(side)}>
                {side}
              </button>
            ))}
          </div>
        )}

        {started && challenge.kind === "memory" && (
          <>
            <div className="memory-sequence">{memorySequence.map((symbol, index) => <span key={`${symbol}-${index}`}>{symbol}</span>)}</div>
            <div className="memory-buttons">
              {MEMORY_SYMBOLS.map((symbol, index) => (
                <button key={symbol} disabled={finished || memoryInput.length >= memorySequence.length} onClick={() => setMemoryInput([...memoryInput, symbol])}>
                  {index + 1}. {symbol}
                </button>
              ))}
            </div>
            <p className="challenge-readout">Press 1-4 or click symbols to recite the rite. Input: {memoryInput.join(", ") || "none"}</p>
          </>
        )}

        {started && challenge.kind === "runner" && (
          <>
            <div className="runner-track">
              {Array.from({ length: RUNNER_CELLS }, (_, index) => {
                const player = index === RUNNER_PLAYER_X;
                const hazard = runnerVisibleObstacles.includes(index);
                return (
                  <span key={index} className={player ? "runner-priest" : hazard ? "runner-hazard" : ""}>
                    {player ? (runnerJumping ? "^" : "P") : hazard ? "!" : ""}
                  </span>
                );
              })}
            </div>
            <p className="challenge-readout">Obstacles move on their own. Press Space or ArrowUp to leap the shadow.</p>
          </>
        )}

        {started && challenge.kind === "snake" && (
          <>
            <div className="snake-grid">
              {Array.from({ length: SNAKE_SIZE * SNAKE_SIZE }, (_, index) => {
                const point = { x: index % SNAKE_SIZE, y: Math.floor(index / SNAKE_SIZE) };
                const head = snakeHead.x === point.x && snakeHead.y === point.y;
                const offering = snakeOfferings.some((item) => item.x === point.x && item.y === point.y);
                return <span key={index} className={head ? "snake-head" : offering ? "snake-offering" : ""}>{head ? "S" : offering ? "*" : ""}</span>;
              })}
            </div>
            <p className="challenge-readout">The serpent moves continuously. Use arrow keys to collect offerings before hitting a wall.</p>
          </>
        )}

        {started && <div className="challenge-actions">
          <button disabled={finished} onClick={() => dispatch({ type: "RESOLVE_CHALLENGE", accepted: false })}>
            Take Certain Sign: {safeText}
          </button>
          {challenge.kind === "timing" && (
            <button className="primary-button" disabled={finished} onClick={() => resolve(position >= target.start && position <= target.end)}>
              Stop Omen
            </button>
          )}
          {challenge.kind === "coin" && (
            <button className="primary-button" disabled={finished || !coinPick} onClick={() => resolve(coinPick === coinResult)}>
              Cast Lots
            </button>
          )}
          {challenge.kind === "memory" && (
            <button className="primary-button" disabled={finished || memoryInput.length !== memorySequence.length} onClick={() => resolve(memoryInput.every((symbol, index) => symbol === memorySequence[index]))}>
              Recite Rite
            </button>
          )}
          {(challenge.kind === "runner" || challenge.kind === "snake") && (
            <button className="primary-button" disabled={finished} onClick={() => resolve(false)}>
              Yield
            </button>
          )}
        </div>}

        {started && <p className="challenge-readout">{instructionFor(challenge.kind)}</p>}
      </section>
    </div>
  );
}

function seededValue(text: string): number {
  return text.split("").reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 17);
}

function rewardText(rv: number, lv: number): string {
  return [rv ? `${rv > 0 ? "+" : ""}${rv} RV` : "", lv ? `${lv > 0 ? "+" : ""}${lv} LV` : ""].filter(Boolean).join(", ") || "no change";
}

function instructionFor(kind: string): string {
  if (kind === "coin") return "The result is hidden until you cast.";
  if (kind === "memory") return "The sequence varies each time and can be entered with number keys.";
  if (kind === "runner") return "This runs continuously; no input means the shadow will catch you.";
  if (kind === "snake") return "This runs continuously; steer with arrow keys.";
  return "The target band and speed vary each time.";
}

function tutorialTitle(kind: string): string {
  if (kind === "coin") return "Cast the Lots";
  if (kind === "memory") return "Recite the Rite";
  if (kind === "runner") return "Flight Through the Outer Court";
  if (kind === "snake") return "Gather the Offerings";
  return "Read the Omen";
}

function tutorialBody(kind: string): string {
  if (kind === "coin") return "Choose Sun or Moon, then cast. The result is hidden until you commit.";
  if (kind === "memory") return "Repeat the symbol sequence using number keys 1-4 or the buttons. The sequence changes each ordeal.";
  if (kind === "runner") return "The shadow moves automatically. Press Space or ArrowUp to jump over hazards before they reach you.";
  if (kind === "snake") return "The serpent moves automatically. Use arrow keys to steer, collect every offering, and avoid the wall.";
  return "The marker moves automatically. Press Space, Enter, or Stop Omen when it enters the sacred band.";
}

function makeOfferings(seed: number): Point[] {
  const candidates: Point[] = [
    { x: 4, y: 2 },
    { x: 3, y: seed % 2 ? 0 : 4 },
    { x: seed % 2 ? 0 : 4, y: 1 + (seed % 3) },
  ];
  return candidates.filter((point, index, list) => list.findIndex((item) => item.x === point.x && item.y === point.y) === index);
}

function nextSnakeHead(head: Point, direction: SnakeDirection): Point {
  if (direction === "Up") return { ...head, y: head.y - 1 };
  if (direction === "Down") return { ...head, y: head.y + 1 };
  if (direction === "Left") return { ...head, x: head.x - 1 };
  return { ...head, x: head.x + 1 };
}

function isOutOfBounds(point: Point): boolean {
  return point.x < 0 || point.y < 0 || point.x >= SNAKE_SIZE || point.y >= SNAKE_SIZE;
}
