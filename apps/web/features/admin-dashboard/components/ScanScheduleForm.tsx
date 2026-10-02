"use client";

import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { useSaveScanSchedule } from "@/features/admin-dashboard/hooks/useScans";
import type { ScanScheduleOut } from "@/lib/api-types";

const MAX_SLOTS = 6;
const DEFAULT_NEW_SLOT = "08:00";

const NEXT_RUN_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Tunis",
});

interface ScanScheduleFormProps {
  state: AsyncState<ScanScheduleOut>;
  onRetry: () => void;
}

function ScheduleEditor({ schedule }: { schedule: ScanScheduleOut }) {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [times, setTimes] = useState<string[]>(schedule.times);
  const saveSchedule = useSaveScanSchedule();

  const isDirty = enabled !== schedule.enabled || times.join() !== schedule.times.join();

  return (
    <form
      className="flex flex-col gap-4 rounded-card border border-gray-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveSchedule.mutate({ enabled, times });
      }}
    >
      <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-900">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-5 w-5 accent-accent"
        />
        Scanner automatiquement chaque jour
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-gray-700">Horaires (heure de Tunis)</legend>
        {times.length === 0 ? <p className="text-xs text-gray-500">Aucun horaire.</p> : null}
        {times.map((time, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="time"
              required
              value={time}
              aria-label={`Horaire ${index + 1}`}
              onChange={(event) => setTimes((current) => current.map((value, i) => (i === index ? event.target.value : value)))}
              className="tabular min-h-[44px] rounded-key border border-field bg-white px-3 text-base text-gray-900"
            />
            <Button
              type="button"
              variant="secondary"
              aria-label={`Retirer l'horaire ${time}`}
              onClick={() => setTimes((current) => current.filter((_, i) => i !== index))}
            >
              Retirer
            </Button>
          </div>
        ))}
        {times.length < MAX_SLOTS ? (
          <Button
            type="button"
            variant="secondary"
            className="self-start"
            onClick={() => setTimes((current) => [...current, DEFAULT_NEW_SLOT])}
          >
            Ajouter un horaire
          </Button>
        ) : (
          <p className="text-xs text-gray-500">{MAX_SLOTS} horaires maximum.</p>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
        <Button type="submit" variant="secondary" disabled={!isDirty || saveSchedule.isPending}>
          Enregistrer
        </Button>
        <p role="status" className="tabular text-sm text-gray-500">
          {saveSchedule.isError
            ? null
            : schedule.enabled && schedule.next_run_at
              ? `Prochain scan : ${NEXT_RUN_FORMAT.format(new Date(schedule.next_run_at))}`
              : "Planification désactivée."}
        </p>
      </div>
      {saveSchedule.isError ? (
        <p role="alert" className="text-xs text-red-600">
          {saveSchedule.error.message}
        </p>
      ) : null}
    </form>
  );
}

export function ScanScheduleForm({ state, onRetry }: ScanScheduleFormProps) {
  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-4">
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-1/4" />
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger la planification." onRetry={onRetry} />;
  }

  // key : apres un enregistrement, l'editeur repart de la valeur sauvegardee.
  return <ScheduleEditor key={`${state.data.enabled}-${state.data.times.join()}`} schedule={state.data} />;
}
