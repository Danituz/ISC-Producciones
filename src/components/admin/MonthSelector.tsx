"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function MonthSelector({
  value,
  onChange,
}: {
  value: string; // YYYY-MM
  onChange: (period: string) => void;
}) {
  const [year, month] = value.split("-").map(Number);
  const monthName = MONTHS_ES[month - 1] || "";

  function prev() {
    const d = new Date(year, month - 2, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function next() {
    const d = new Date(year, month, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function goToday() {
    const now = new Date();
    onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }

  const isCurrentMonth = (() => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  })();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={prev}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <button
        type="button"
        onClick={goToday}
        className={[
          "min-w-[140px] rounded-lg border px-4 py-2 text-sm font-medium transition",
          isCurrentMonth
            ? "border-foreground/20 bg-foreground/10 text-foreground"
            : "border-border/60 bg-background/50 text-foreground hover:bg-muted/50",
        ].join(" ")}
      >
        {monthName} {year}
      </button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={next}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
