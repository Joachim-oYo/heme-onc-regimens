"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/**
 * A simple tag input for a drug's toxicities. Type and press Enter (or comma)
 * to add; each entry is a removable badge.
 */
export function ToxicityInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder="Type a toxicity, press Enter"
        aria-label="Add toxicity"
      />
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li key={t}>
              <Badge variant="secondary" className="gap-1">
                {t}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== t))}
                  aria-label={`Remove ${t}`}
                  className="hover:text-foreground -mr-0.5 rounded-sm"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
