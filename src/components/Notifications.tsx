import { X } from "lucide-react";
import { GameAction } from "../game";
import { GameNotification } from "../types";

type Props = {
  notifications: GameNotification[];
  dispatch: React.Dispatch<GameAction>;
};

export default function Notifications({ notifications, dispatch }: Props) {
  if (!notifications.length) return null;

  return (
    <section className="notification-stack" aria-label="game notifications">
      {notifications.map((notification) => (
        <article key={notification.id} className={`game-notification ${notification.kind}`}>
          <div>
            <strong>{notification.title}</strong>
            <p>{notification.body}</p>
          </div>
          <button
            aria-label={`Dismiss ${notification.title}`}
            onClick={() => dispatch({ type: "DISMISS_NOTIFICATION", notificationId: notification.id })}
          >
            <X size={15} />
          </button>
        </article>
      ))}
    </section>
  );
}
