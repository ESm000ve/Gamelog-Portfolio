import { gameStatusLabel } from "../../services/gameStatus";
import { Star } from "../icons";
import { StarRating } from "../ui/StarRating";
import {
  STATUS_COLORS,
  STATUS_SUBTLE,
  COMPLETION_COLORS,
  COMPLETION_SUBTLE,
} from "../ui/statusColors";
import type { Status, Completion } from "../../types";
import { shortPlatform } from "../../utils/platforms";
import { StatusIcon } from "./CoverCardIcons";
import "./CoverCardMetadata.css";

interface CoverCardMetadataProps {
  platform?: string;
  releaseYear?: number;
  status?: Status;
  completion?: Completion;
  rating?: number;
}

export function CoverCardMetadata({
  platform,
  releaseYear,
  status,
  completion,
  rating,
}: CoverCardMetadataProps) {
  const label = status ? gameStatusLabel(status, completion) : undefined;
  const outcome = status === "Played" && label !== "Played" ? completion : undefined;
  return (
    <div className="card-metadata">
      {/* Row 1: System + Year */}
      <div className="card-metadata-platform">
        {[shortPlatform(platform), releaseYear].filter(Boolean).join(" · ")}
      </div>

      {/* Row 2: Status & Rating */}
      <div className="card-metadata-row">
        {status && label ? (
          <div
            className="card-metadata-status"
            style={{
              background: outcome ? COMPLETION_SUBTLE[outcome] : STATUS_SUBTLE[status],
              color: outcome ? COMPLETION_COLORS[outcome] : STATUS_COLORS[status],
            }}
          >
            {status !== "Played" && <StatusIcon status={status} />}
            {label}
          </div>
        ) : (
          <div />
        )}

        {typeof rating === "number" ? (
          <div className="card-metadata-rating">
            <StarRating rating={rating} size={12} showValue={true} />
          </div>
        ) : (
          <div className="card-metadata-rating" aria-label="Not rated">
            <Star size={12} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
