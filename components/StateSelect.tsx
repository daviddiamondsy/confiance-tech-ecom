"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES, POPULAR_NIGERIAN_STATE_SET, POPULAR_NIGERIAN_STATES } from "@/lib/nigerian-states";

interface StateSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

function StateOption({
  state,
  selected,
  onSelect,
}: {
  state: string;
  selected: boolean;
  onSelect: (state: string) => void;
}) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={() => onSelect(state)}
        className={cn(
          "w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 hover:bg-primary-50 transition-colors",
          selected && "bg-primary-50 text-primary-700 font-medium"
        )}
      >
        <span>{state}</span>
        {selected && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
      </button>
    </li>
  );
}

export default function StateSelect({
  value,
  onChange,
  id,
  name,
  required = false,
  placeholder = "Select your state",
  className,
  inputClassName,
}: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filteredStates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [...NIGERIAN_STATES];
    return NIGERIAN_STATES.filter((state) => state.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const popularStates = useMemo(() => {
    if (query.trim()) {
      return POPULAR_NIGERIAN_STATES.filter((state) => filteredStates.includes(state));
    }
    return [...POPULAR_NIGERIAN_STATES];
  }, [query, filteredStates]);

  const remainingStates = useMemo(() => {
    if (query.trim()) return filteredStates;
    return NIGERIAN_STATES.filter((state) => !POPULAR_NIGERIAN_STATE_SET.has(state));
  }, [query, filteredStates]);

  useEffect(() => {
    if (!open) return;

    searchRef.current?.focus();

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function selectState(state: string) {
    onChange(state);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value} required={required} />}

      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "input-field flex items-center justify-between gap-2 text-left",
          !value && "text-slate-400",
          inputClassName
        )}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <MapPin className="h-4 w-4 text-primary-500 flex-shrink-0" />
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute z-[100] mt-2 w-full min-w-[16rem] rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search states..."
                aria-label="Search Nigerian states"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <ul id={listId} role="listbox" aria-label="Nigerian states" className="max-h-64 overflow-y-auto py-1">
            {!query && popularStates.length > 0 && (
              <>
                <li className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Popular
                </li>
                {popularStates.map((state) => (
                  <StateOption
                    key={`popular-${state}`}
                    state={state}
                    selected={value === state}
                    onSelect={selectState}
                  />
                ))}
                <li className="my-1 border-t border-slate-100" aria-hidden="true" />
                <li className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  All states
                </li>
              </>
            )}

            {(query ? filteredStates : remainingStates).map((state) => (
              <StateOption
                key={state}
                state={state}
                selected={value === state}
                onSelect={selectState}
              />
            ))}

            {filteredStates.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">No state found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
