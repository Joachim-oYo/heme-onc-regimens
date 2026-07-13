"use client";
import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface Option {
  id: string;
  label: string;
}

/**
 * Searchable multi-select for picking related entities (many-to-many edges).
 * Selected IDs render as removable badges; the popover lists candidates with a
 * checkmark for chosen ones.
 */
export function RelationshipMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyText = "No options.",
}: {
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const byId = new Map(options.map((o) => [o.id, o]));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
              aria-expanded={open}
            >
              <span className="text-muted-foreground">
                {value.length ? `${value.length} selected` : placeholder}
              </span>
              <ChevronsUpDown className="size-4 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[min(22rem,90vw)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search…" />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const selected = value.includes(opt.id);
                  return (
                    <CommandItem
                      key={opt.id}
                      value={opt.label}
                      onSelect={() => toggle(opt.id)}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {opt.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id}>
              <Badge variant="secondary" className="gap-1">
                {byId.get(id)?.label ?? id}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={`Remove ${byId.get(id)?.label ?? id}`}
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
