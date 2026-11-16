import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eraser, Loader2, PenLine, Plus, Trash2, Type } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { addSessionSheet, clearSheet, deleteStroke, fetchStrokes, insertStroke, setActiveSessionSheet, type SessionRow } from "@/lib/api";

type Point = [number, number];
type BoardStroke = { id: string; kind: string; payload: Record<string, unknown> };
const COLORS = [
  { name: "Ink", value: "foreground", className: "bg-foreground" },
  { name: "Primary", value: "primary", className: "bg-primary" },
  { name: "Accent", value: "accent", className: "bg-accent" },
  { name: "Alert", value: "destructive", className: "bg-destructive" },
  { name: "Chart", value: "chart-4", className: "bg-chart-4" },
] as const;

export function SessionWhiteboard({ session, userId }: { session: SessionRow; userId: string }) {
  const queryClient = useQueryClient();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<"pen" | "text" | "eraser">("pen");
  const [color, setColor] = useState<string>("foreground");
  const [draft, setDraft] = useState<Point[]>([]);
  const [textValue, setTextValue] = useState("");
  const [textPoint, setTextPoint] = useState<Point | null>(null);
  const [drawing, setDrawing] = useState(false);
  const sheet = session.active_sheet;
  const queryKey = ["session-strokes", session.id, sheet];
  const strokesQuery = useQuery({
    queryKey,
    queryFn: () => fetchStrokes(session.id, sheet),
  });
  const realtimeStatus = useRealtimeInvalidate(
    `whiteboard-${session.id}-${userId}`,
    [{ table: "session_strokes", filter: `session_id=eq.${session.id}`, keys: [queryKey] }],
    true,
  );

  const saveMutation = useMutation({
    mutationFn: (value: { kind: string; payload: Record<string, unknown> }) => insertStroke({
      sessionId: session.id,
      sheet,
      kind: value.kind,
      payload: value.payload,
      createdBy: userId,
    }),
    onSuccess: (stroke) => {
      queryClient.setQueryData<BoardStroke[]>(queryKey, (current = []) => [...current, stroke]);
    },
    onError: (error) => toast.error("Could not save this board mark", { description: error.message }),
  });

  const sheetMutation = useMutation({
    mutationFn: () => addSessionSheet(session.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", session.id] }),
    onError: (error) => toast.error("Could not add a sheet", { description: error.message }),
  });
  const selectSheetMutation = useMutation({
    mutationFn: (next: number) => setActiveSessionSheet(session.id, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session", session.id] }),
    onError: (error) => toast.error("Could not open that sheet", { description: error.message }),
  });
  const clearMutation = useMutation({
    mutationFn: () => clearSheet(session.id, sheet),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast.error("Could not clear the sheet", { description: error.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteStroke,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast.error("Could not erase that mark", { description: error.message }),
  });

  function pointFromEvent(event: React.PointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * 1000, ((event.clientY - rect.top) / rect.height) * 600];
  }

  function onBoardPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const point = pointFromEvent(event);
    if (tool === "text") {
      setTextPoint(point);
      return;
    }
    if (tool === "eraser") return;
    setDrawing(true);
    setDraft([point]);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onBoardPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!drawing) return;
    setDraft((current) => [...current, pointFromEvent(event)]);
  }

  function finishDrawing() {
    if (!drawing || draft.length === 0) return;
    setDrawing(false);
    setDraft([]);
    void saveMutation.mutateAsync({ kind: "stroke", payload: { points: draft, color } });
  }

  function commitText() {
    if (!textPoint || !textValue.trim()) {
      setTextPoint(null);
      setTextValue("");
      return;
    }
    void saveMutation.mutateAsync({
      kind: "text",
      payload: { x: textPoint[0], y: textPoint[1], text: textValue.trim().slice(0, 140), color },
    });
    setTextPoint(null);
    setTextValue("");
  }

  const strokes = (strokesQuery.data ?? []) as BoardStroke[];
  const activeColor = COLORS.find((item) => item.value === color);
  const boardColor = activeColor ? `var(--color-${activeColor.value})` : "var(--color-foreground)";

  return (
    <section className="space-y-3" aria-label="Shared whiteboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1" role="toolbar" aria-label="Whiteboard tools">
          <Button variant={tool === "pen" ? "secondary" : "ghost"} size="icon" aria-label="Draw" aria-pressed={tool === "pen"} onClick={() => setTool("pen")}><PenLine /></Button>
          <Button variant={tool === "text" ? "secondary" : "ghost"} size="icon" aria-label="Add text" aria-pressed={tool === "text"} onClick={() => setTool("text")}><Type /></Button>
          <Button variant={tool === "eraser" ? "secondary" : "ghost"} size="icon" aria-label="Erase marks" aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")}><Eraser /></Button>
          <span className="mx-1 h-6 border-l border-border" />
          {COLORS.map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              size="icon"
              aria-label={`${item.name} color`}
              aria-pressed={color === item.value}
              onClick={() => setColor(item.value)}
            >
              <span className={`size-4 rounded-full ${item.className} ${color === item.value ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" role="status">
            {realtimeStatus === "live" ? "Live" : realtimeStatus === "reconnecting" ? "Reconnecting" : "Connecting"}
          </span>
          <Button variant="outline" size="sm" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending || strokes.length === 0}>
            {clearMutation.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />} Clear sheet
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-2">
          {Array.from({ length: session.sheet_count }, (_, index) => (
            <Button
              key={index}
              size="sm"
              variant={index === sheet ? "secondary" : "outline"}
              aria-pressed={index === sheet}
              onClick={() => selectSheetMutation.mutate(index)}
              disabled={selectSheetMutation.isPending}
            >
              Sheet {index + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Add sheet"
            title="Add sheet"
            onClick={() => sheetMutation.mutate()}
            disabled={sheetMutation.isPending || session.sheet_count >= 20}
          >
            {sheetMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-md border border-border bg-card">
        {strokesQuery.isLoading ? (
          <div className="grid aspect-[5/3] place-items-center text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
        ) : (
          <svg
            ref={svgRef}
            viewBox="0 0 1000 600"
            role="img"
            aria-label={`Whiteboard sheet ${sheet + 1}`}
            className={`aspect-[5/3] w-full touch-none bg-card ${tool === "pen" ? "cursor-crosshair" : tool === "text" ? "cursor-text" : "cursor-cell"}`}
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={finishDrawing}
            onPointerCancel={finishDrawing}
          >
            {strokes.map((stroke) => {
              const payload = stroke.payload;
              const strokeColor = `var(--color-${String(payload.color ?? "foreground")})`;
              if (stroke.kind === "text") {
                const x = Number(payload.x ?? 0);
                const y = Number(payload.y ?? 0);
                return (
                  <text
                    key={stroke.id}
                    x={x}
                    y={y}
                    fill={strokeColor}
                    fontSize="28"
                    className={tool === "eraser" ? "cursor-pointer" : ""}
                    onPointerDown={tool === "eraser" ? (event) => { event.stopPropagation(); deleteMutation.mutate(stroke.id); } : undefined}
                  >
                    {String(payload.text ?? "")}
                  </text>
                );
              }
              const points = Array.isArray(payload.points) ? payload.points as Point[] : [];
              const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");
              return (
                <path
                  key={stroke.id}
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={tool === "eraser" ? "cursor-pointer" : ""}
                  onPointerDown={tool === "eraser" ? (event) => { event.stopPropagation(); deleteMutation.mutate(stroke.id); } : undefined}
                />
              );
            })}
            {draft.length > 0 ? (
              <path
                d={draft.map((point, index) => `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ")}
                fill="none"
                stroke={boardColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {textPoint && !textValue ? <circle cx={textPoint[0]} cy={textPoint[1]} r="5" fill={boardColor} /> : null}
          </svg>
        )}
        {textPoint ? (
          <form
            className="absolute inset-x-3 bottom-3 flex gap-2 sm:inset-auto sm:bottom-4 sm:left-4 sm:w-96"
            onSubmit={(event) => { event.preventDefault(); commitText(); }}
          >
            <Input autoFocus maxLength={140} value={textValue} onChange={(event) => setTextValue(event.target.value)} placeholder="Type a note" aria-label="Board note" />
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setTextPoint(null); setTextValue(""); }}>Cancel</Button>
          </form>
        ) : null}
      </div>
      {strokesQuery.isError ? (
        <div className="flex items-center justify-between gap-3 text-sm text-destructive">
          <span>Could not load this sheet.</span>
          <Button variant="outline" size="sm" onClick={() => void strokesQuery.refetch()}>Try again</Button>
        </div>
      ) : null}
    </section>
  );
}