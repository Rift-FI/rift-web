import React, { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ value = 0, onChange, className = "" }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={`flex gap-1 ${className}`} role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered !== null ? star <= hovered : star <= value;
        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            aria-checked={value === star}
            role="radio"
            tabIndex={0}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(null)}
            onClick={() => onChange?.(star)}
            className="p-0 bg-transparent border-none cursor-pointer active:scale-95"
          >
            <Star
              size={24}
              fill={filled ? "var(--color-accent-primary)" : "none"}
              stroke={filled ? "var(--color-accent-primary)" : "#999"}
              style={{ transition: "fill 0.15s, stroke 0.15s" }}
            />
          </button>
        );
      })}
    </div>
  );
};
