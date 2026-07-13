"use client";
import { useGraph } from "@/state/GraphProvider";
import { useHighlights } from "@/state/useHighlights";
import type { Drug } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Shows mechanism of action + toxicities for the relevant drug. The drug shown
 * is: the effective selection if it is a drug, else the sole highlighted drug
 * if exactly one, else nothing.
 *
 * `variant="column"` renders inline as the fourth column (desktop).
 * `variant="dock"` renders a fixed bottom card that only appears when a drug is
 * resolved (mobile), so it doesn't take permanent vertical space.
 */
export function InfoPanel({
  variant = "column",
}: {
  variant?: "column" | "dock";
}) {
  const { index } = useGraph();
  const { set } = useHighlights();

  let drug: Drug | undefined;
  if (set) {
    if (set.source.kind === "drug") drug = index.drug.get(set.source.id);
    else if (set.drugs.size === 1) drug = index.drug.get([...set.drugs][0]);
  }

  if (variant === "dock") {
    // Only mount content when there's a drug; the empty prompt is desktop-only.
    return (
      <div
        className={cn(
          "bg-card fixed inset-x-0 bottom-0 z-20 border-t shadow-lg lg:hidden",
          "motion-safe:transition-transform motion-safe:duration-200",
          drug ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!drug}
      >
        <div className="max-h-[45dvh] overflow-y-auto p-4" aria-live="polite">
          {drug ? <DrugInfo drug={drug} /> : null}
        </div>
      </div>
    );
  }

  return (
    <section className="hidden min-h-0 flex-col lg:flex" aria-live="polite">
      <header className="mb-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Info</h2>
      </header>
      <div className="min-h-0 overflow-y-auto pr-1">
        {drug ? (
          <DrugInfo drug={drug} />
        ) : (
          <p className="text-muted-foreground py-6 text-sm">
            Select a drug (or an entity that resolves to a single drug) to see its
            mechanism of action and toxicities.
          </p>
        )}
      </div>
    </section>
  );
}

function DrugInfo({ drug }: { drug: Drug }) {
  return (
    <article className="space-y-4">
      <h3 className="text-tier-drug text-base font-semibold">{drug.name}</h3>
      <div>
        <h4 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Mechanism of action
        </h4>
        <p className="text-sm leading-relaxed">
          {drug.mechanism || <span className="text-muted-foreground">—</span>}
        </p>
      </div>
      <div>
        <h4 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Toxicities
        </h4>
        {drug.toxicities.length ? (
          <ul className="list-inside list-disc space-y-0.5 text-sm">
            {drug.toxicities.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">—</p>
        )}
      </div>
    </article>
  );
}
