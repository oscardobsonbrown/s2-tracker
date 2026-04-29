"use client";

import {
  Alert,
  AlertDescription,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Input } from "@repo/design-system/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@repo/design-system/components/ui/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { Slider } from "@repo/design-system/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDownIcon } from "lucide-react";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  RankingPreviewResponse,
  RankingPreviewRow,
  RankingSortColumn,
  RankingWeightsInput,
  TravelApiError,
} from "@/lib/travel-types";

const BALANCED_WEIGHTS: RankingWeightsInput = {
  snowfall7: 35,
  snowfall14: 15,
  snowDepth: 20,
  temperature: 15,
  wind: 10,
  elevation: 5,
};

const LOADING_ROW_KEYS = [
  "ranking-skeleton-1",
  "ranking-skeleton-2",
  "ranking-skeleton-3",
  "ranking-skeleton-4",
  "ranking-skeleton-5",
  "ranking-skeleton-6",
  "ranking-skeleton-7",
  "ranking-skeleton-8",
] as const;

function formatNumber(value: number | null, suffix = "") {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(1)}${suffix ? ` ${suffix}` : ""}`;
}

function isTravelApiError(value: unknown): value is TravelApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as TravelApiError).error?.message === "string"
  );
}

function sliderValueAsNumber(value: number | readonly number[]) {
  return Array.isArray(value) ? (value[0] ?? 0) : value;
}

async function fetchRankingPreview(requestBody: unknown, signal: AbortSignal) {
  const response = await fetch("/api/travel/ranking-preview", {
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
  const payload = (await response.json()) as
    | RankingPreviewResponse
    | TravelApiError;

  if (!response.ok || isTravelApiError(payload)) {
    throw new Error(
      isTravelApiError(payload)
        ? payload.error.message
        : "Ranking preview could not be loaded."
    );
  }

  return payload;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function previewErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ranking preview could not be reached.";
}

function LoadingTable() {
  return (
    <div className="grid gap-2">
      {LOADING_ROW_KEYS.map((key) => (
        <Skeleton className="h-12 w-full" key={key} />
      ))}
    </div>
  );
}

function buildTableContent({
  error,
  isLoading,
  pageIndex,
  preview,
  setPageIndex,
  table,
  toggleSort,
  totalPages,
}: {
  error: string | null;
  isLoading: boolean;
  pageIndex: number;
  preview: RankingPreviewResponse | null;
  setPageIndex: Dispatch<SetStateAction<number>>;
  table: ReturnType<typeof useReactTable<RankingPreviewRow>>;
  toggleSort: (column: RankingSortColumn) => void;
  totalPages: number;
}) {
  if (isLoading) {
    return <LoadingTable />;
  }

  if (!preview?.rows.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            {error
              ? "Ranking preview unavailable"
              : "No resorts matched these controls"}
          </EmptyTitle>
          <EmptyDescription>
            {error
              ? error
              : "Try lowering the minimum score or broadening your search."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    );
  }

  return (
    <div className="grid gap-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id as RankingSortColumn;
                const isSortable =
                  columnId === "rank" ||
                  columnId === "score" ||
                  columnId === "name" ||
                  columnId === "country" ||
                  columnId === "snowfall7Cm" ||
                  columnId === "snowfall14Cm" ||
                  columnId === "snowDepthCm" ||
                  columnId === "avgTempC" ||
                  columnId === "avgWindKmh" ||
                  columnId === "maxElevationM";

                return (
                  <TableHead key={header.id}>
                    <button
                      className={isSortable ? "flex items-center gap-1" : ""}
                      onClick={() => {
                        if (isSortable) {
                          toggleSort(columnId);
                        }
                      }}
                      type="button"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {isSortable ? (
                        <ArrowUpDownIcon className="size-3 text-muted-foreground" />
                      ) : null}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Showing {preview.rows.length} of {preview.totalRows} rows
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setPageIndex((current) => Math.max(0, current - 1));
                }}
                text="Previous"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {pageIndex + 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setPageIndex((current) =>
                    Math.min(totalPages - 1, current + 1)
                  );
                }}
                text="Next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export function RankingLabClient() {
  const [weights, setWeights] = useState<RankingWeightsInput>(BALANCED_WEIGHTS);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [minimumScore, setMinimumScore] = useState("");
  const [downhillOnly, setDownhillOnly] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(50);
  const [sortColumn, setSortColumn] = useState<RankingSortColumn>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [preview, setPreview] = useState<RankingPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const requestBody = useMemo(
    () => ({
      filters: {
        country: country || undefined,
        downhillOnly,
        minimumScore: minimumScore ? Number(minimumScore) : undefined,
        query: query || undefined,
      },
      pagination: {
        pageIndex,
        pageSize,
      },
      sort: {
        column: sortColumn,
        direction: sortDirection,
      },
      weights,
    }),
    [
      country,
      downhillOnly,
      minimumScore,
      pageIndex,
      pageSize,
      query,
      sortColumn,
      sortDirection,
      weights,
    ]
  );

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      const previewRequest = fetchRankingPreview(
        requestBody,
        abortController.signal
      );

      previewRequest
        .then((payload) => {
          if (isActive) {
            setPreview(payload);
          }
        })
        .catch((fetchError: unknown) => {
          if (isActive && !isAbortError(fetchError)) {
            setError(previewErrorMessage(fetchError));
            setPreview(null);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
      abortController.abort();
    };
  }, [requestBody]);

  const columns = useMemo<ColumnDef<RankingPreviewRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
      },
      {
        accessorKey: "resort.name",
        header: "Resort",
        cell: ({ row }) => (
          <div className="grid gap-1">
            <span className="font-medium">{row.original.resort.name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.resort.locality ?? "Location unavailable"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "resort.country",
        header: "Country",
        cell: ({ row }) => row.original.resort.country ?? "Unknown",
      },
      {
        accessorKey: "resort.region",
        header: "Region",
        cell: ({ row }) => row.original.resort.region ?? "Unknown",
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => row.original.score.toFixed(1),
      },
      {
        accessorKey: "metrics.snowfall7Cm",
        header: "Snowfall 7d",
        cell: ({ row }) => formatNumber(row.original.metrics.snowfall7Cm, "cm"),
      },
      {
        accessorKey: "metrics.snowfall14Cm",
        header: "Snowfall 14d",
        cell: ({ row }) =>
          formatNumber(row.original.metrics.snowfall14Cm, "cm"),
      },
      {
        accessorKey: "metrics.snowDepthCm",
        header: "Snow depth",
        cell: ({ row }) => formatNumber(row.original.metrics.snowDepthCm, "cm"),
      },
      {
        accessorKey: "metrics.avgTempC",
        header: "Avg temp",
        cell: ({ row }) => formatNumber(row.original.metrics.avgTempC, "C"),
      },
      {
        accessorKey: "metrics.avgWindKmh",
        header: "Avg wind",
        cell: ({ row }) =>
          formatNumber(row.original.metrics.avgWindKmh, "km/h"),
      },
      {
        accessorKey: "metrics.maxElevationM",
        header: "Max elevation",
        cell: ({ row }) =>
          formatNumber(row.original.metrics.maxElevationM, "m"),
      },
      {
        accessorKey: "scoreBreakdown",
        header: "Score breakdown",
        cell: ({ row }) =>
          `7d ${row.original.scoreBreakdown.snowfall7} / depth ${row.original.scoreBreakdown.snowDepth} / wind ${row.original.scoreBreakdown.wind}`,
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: preview?.rows ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = preview
    ? Math.max(1, Math.ceil(preview.totalRows / pageSize))
    : 1;

  function updateWeight(key: keyof RankingWeightsInput, nextValue: number) {
    setPageIndex(0);
    setWeights((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  function toggleSort(column: RankingSortColumn) {
    setPageIndex(0);
    setSortColumn((currentColumn) => {
      if (currentColumn === column) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc"
        );
        return currentColumn;
      }

      setSortDirection("asc");
      return column;
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <section className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm">
            Lab-only tuning on the latest cached forecast snapshot
          </p>
          <h1 className="font-semibold text-2xl tracking-normal">
            Tune the ski resort ranking model.
          </h1>
          <p className="max-w-3xl text-muted-foreground text-sm">
            Adjust the relative weight of snowfall, depth, temperature, wind,
            and elevation. The table recomputes server-side using cached resort
            weather features, not live weather API calls.
          </p>
        </div>
        <div className="flex items-start justify-end">
          <Button nativeButton={false} render={<Link href="/travel" />}>
            Back to Travel
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-4 rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-lg">Model weights</h2>
              <p className="text-muted-foreground text-sm">
                Raw sliders normalize to a 100-point score.
              </p>
            </div>
            <Button
              onClick={() => {
                setPageIndex(0);
                setWeights(BALANCED_WEIGHTS);
              }}
              type="button"
              variant="outline"
            >
              Reset to Balanced
            </Button>
          </div>

          {(
            [
              ["snowfall7", "Snowfall 7d"],
              ["snowfall14", "Snowfall 14d"],
              ["snowDepth", "Snow depth"],
              ["temperature", "Temperature"],
              ["wind", "Wind"],
              ["elevation", "Elevation"],
            ] as const
          ).map(([key, label]) => (
            <div className="grid gap-2" key={key}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-muted-foreground text-sm">
                  raw {weights[key]}
                  {preview
                    ? ` • ${preview.normalizedWeights[key].toFixed(1)}%`
                    : ""}
                </span>
              </div>
              <Slider
                aria-label={label}
                max={100}
                min={0}
                onValueChange={(value) =>
                  updateWeight(key, sliderValueAsNumber(value))
                }
                value={[weights[key]]}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">Ranking preview</h2>
                <p className="text-muted-foreground text-sm">
                  {preview
                    ? `${preview.totalRows} resort rows available`
                    : "Loading latest snapshot"}
                </p>
              </div>
              {preview ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Snapshot {preview.snapshotDate}
                  </Badge>
                  {preview.isStale ? (
                    <Badge variant="outline">Snapshot may be stale</Badge>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]">
              <Input
                aria-label="Search resorts"
                onChange={(event) => {
                  setPageIndex(0);
                  setQuery(event.target.value);
                }}
                placeholder="Search resort, region, or locality"
                value={query}
              />
              <Input
                aria-label="Filter country"
                onChange={(event) => {
                  setPageIndex(0);
                  setCountry(event.target.value);
                }}
                placeholder="Country filter"
                value={country}
              />
              <Input
                aria-label="Minimum score"
                inputMode="decimal"
                onChange={(event) => {
                  setPageIndex(0);
                  setMinimumScore(event.target.value);
                }}
                placeholder="Minimum score"
                value={minimumScore}
              />
              <NativeSelect
                aria-label="Rows per page"
                onChange={(event) => {
                  setPageIndex(0);
                  setPageSize(Number(event.target.value) as 25 | 50 | 100);
                }}
                value={String(pageSize)}
              >
                <NativeSelectOption value="25">25 rows</NativeSelectOption>
                <NativeSelectOption value="50">50 rows</NativeSelectOption>
                <NativeSelectOption value="100">100 rows</NativeSelectOption>
              </NativeSelect>
              <label
                className="flex items-center gap-2 rounded-md border px-3 text-sm"
                htmlFor="downhill-only"
              >
                <Checkbox
                  checked={downhillOnly}
                  id="downhill-only"
                  onCheckedChange={(value) => {
                    setPageIndex(0);
                    setDownhillOnly(Boolean(value));
                  }}
                />
                Downhill only
              </label>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {preview?.isStale ? (
            <Alert>
              <AlertDescription>
                Ranking data is using the latest available snapshot from{" "}
                {preview.snapshotDate}.
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="rounded-lg border bg-background p-4">
            {buildTableContent({
              error,
              isLoading,
              pageIndex,
              preview,
              setPageIndex,
              table,
              toggleSort,
              totalPages,
            })}
          </section>
        </div>
      </section>
    </main>
  );
}
