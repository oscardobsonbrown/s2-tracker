"use client";

import { cn } from "@repo/design-system/lib/utils";
import type { COBEOptions, Globe } from "cobe";
import createGlobe from "cobe";
import type { ReactElement, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CobeGlobeProps {
  readonly className?: string;
  readonly size?: number;
}

interface DragStart {
  readonly clientX: number;
  readonly clientY: number;
  readonly phi: number;
  readonly theta: number;
}

interface GlobeTag {
  readonly detail: string;
  readonly id: string;
  readonly label: string;
  readonly location: [number, number];
  readonly offset: [number, number];
  readonly placement: "above" | "below";
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const horizontalDragRadians = Math.PI * 1.2;
const verticalDragRadians = Math.PI * 0.7;
const autoRotationSpeed = 0.0035;
const rotationEase = 0.09;

const globeTags = [
  {
    detail: "Hokkaido powder",
    id: "niseko",
    label: "Niseko",
    location: [42.8048, 140.6874],
    offset: [0, -18],
    placement: "above",
  },
  {
    detail: "Alpine storm cycles",
    id: "chamonix",
    label: "Chamonix",
    location: [45.9237, 6.8694],
    offset: [0, -18],
    placement: "above",
  },
  {
    detail: "Coastal deep days",
    id: "whistler",
    label: "Whistler",
    location: [50.1163, -122.9574],
    offset: [0, -18],
    placement: "above",
  },
  {
    detail: "Southern winter",
    id: "valle-nevado",
    label: "Valle Nevado",
    location: [-33.3538, -70.2494],
    offset: [0, 18],
    placement: "below",
  },
] satisfies readonly GlobeTag[];

const positionTagButton = (
  button: HTMLButtonElement,
  anchor: HTMLElement,
  containerRect: DOMRect,
  tag: GlobeTag,
  shouldShow: boolean
) => {
  const anchorRect = anchor.getBoundingClientRect();
  const [offsetX, offsetY] = tag.offset;
  const x = anchorRect.left + anchorRect.width / 2 - containerRect.left;
  const y = anchorRect.top + anchorRect.height / 2 - containerRect.top;

  button.style.opacity = shouldShow ? "1" : "0";
  button.style.pointerEvents = shouldShow ? "auto" : "none";
  button.style.transform = `translate(${x + offsetX}px, ${
    y + offsetY
  }px) translate(-50%, ${tag.placement === "above" ? "-100%" : "0"})`;
};

export function CobeGlobe({
  className,
  size = 520,
}: CobeGlobeProps): ReactElement {
  const [openTagId, setOpenTagId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const tagButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const phiRef = useRef(0);
  const thetaRef = useRef(0.25);
  const rotationSpeedRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isReducedMotionRef = useRef(false);
  const isTagOpenRef = useRef(false);
  const openTagIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const canvasSizeRef = useRef({ height: size, width: size });
  const renderSizeRef = useRef({ height: size, width: size });

  useEffect(() => {
    openTagIdRef.current = openTagId;
    isTagOpenRef.current = openTagId !== null;
  }, [openTagId]);

  const updateTagPositions = useCallback(() => {
    const container = containerRef.current;
    const host = hostRef.current;

    if (!(container && host)) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const rootStyle = getComputedStyle(document.documentElement);

    for (const tag of globeTags) {
      const button = tagButtonRefs.current.get(tag.id);
      const anchor = host.querySelector<HTMLElement>(
        `[style*="--cobe-${tag.id}"]`
      );

      if (!(button && anchor)) {
        continue;
      }

      const markerVisibility = rootStyle
        .getPropertyValue(`--cobe-visible-${tag.id}`)
        .trim();
      const shouldShow =
        markerVisibility.length > 0 || openTagIdRef.current === tag.id;

      positionTagButton(button, anchor, containerRect, tag, shouldShow);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const host = hostRef.current;

    if (!(container && host)) {
      return;
    }

    const canvas = document.createElement("canvas");
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvasRef.current = canvas;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "h-full w-full";
    host.replaceChildren(canvas);
    isReducedMotionRef.current = mediaQuery.matches;

    const updateCanvasSize = () => {
      const bounds = container.getBoundingClientRect();
      const width = Math.max(1, bounds.width || size);
      const height = Math.max(1, bounds.height || size);

      canvasSizeRef.current = { height, width };
      renderSizeRef.current = {
        height: Math.floor(height),
        width: Math.floor(width),
      };
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      isReducedMotionRef.current = event.matches;
    };

    mediaQuery.addEventListener("change", handleReducedMotionChange);
    updateCanvasSize();

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", updateCanvasSize);
    }

    const globeOptions: COBEOptions = {
      baseColor: [1, 1, 1],
      dark: 0,
      devicePixelRatio,
      diffuse: 1.2,
      glowColor: [1, 1, 1],
      height: renderSizeRef.current.height,
      mapBrightness: 6,
      mapSamples: 16_000,
      markerColor: [0.1, 0.1, 0.1],
      markerElevation: 0,
      markers: globeTags.map((tag) => ({
        id: tag.id,
        location: tag.location,
        size: 0.03,
      })),
      offset: [0, 0],
      opacity: 1,
      phi: phiRef.current,
      scale: 1,
      theta: thetaRef.current,
      width: renderSizeRef.current.width,
    };

    try {
      globeRef.current = createGlobe(canvas, globeOptions);
    } catch {
      host.replaceChildren();
      canvasRef.current = null;
      globeRef.current = null;

      return () => {
        mediaQuery.removeEventListener("change", handleReducedMotionChange);
        resizeObserver?.disconnect();
        window.removeEventListener("resize", updateCanvasSize);
      };
    }

    let animationFrameId = 0;

    const renderFrame = () => {
      if (globeRef.current) {
        globeRef.current.update({
          height: renderSizeRef.current.height,
          phi: phiRef.current,
          theta: thetaRef.current,
          width: renderSizeRef.current.width,
        });

        updateTagPositions();

        const targetRotationSpeed =
          isReducedMotionRef.current ||
          isDraggingRef.current ||
          isTagOpenRef.current
            ? 0
            : autoRotationSpeed;
        const nextRotationSpeed =
          rotationSpeedRef.current +
          (targetRotationSpeed - rotationSpeedRef.current) * rotationEase;

        rotationSpeedRef.current =
          Math.abs(targetRotationSpeed - nextRotationSpeed) < 0.000_01
            ? targetRotationSpeed
            : nextRotationSpeed;

        if (isDraggingRef.current) {
          rotationSpeedRef.current = 0;
        }

        phiRef.current += rotationSpeedRef.current;
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      mediaQuery.removeEventListener("change", handleReducedMotionChange);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateCanvasSize);
      globeRef.current?.destroy();
      globeRef.current = null;
      canvasRef.current = null;
      host.replaceChildren();
    };
  }, [size, updateTagPositions]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOpenTagId(null);
    isDraggingRef.current = true;
    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      phi: phiRef.current,
      theta: thetaRef.current,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!(isDraggingRef.current && dragStartRef.current)) {
      return;
    }

    const { height, width } = canvasSizeRef.current;
    const deltaX = event.clientX - dragStartRef.current.clientX;
    const deltaY = event.clientY - dragStartRef.current.clientY;

    phiRef.current =
      dragStartRef.current.phi + (deltaX / width) * horizontalDragRadians;
    thetaRef.current = clamp(
      dragStartRef.current.theta + (deltaY / height) * verticalDragRadians,
      -0.45,
      0.75
    );
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    dragStartRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      aria-describedby="cobe-globe-instructions"
      aria-label="Interactive rotating globe. Drag to rotate."
      className={cn(
        "relative aspect-square w-full cursor-grab touch-none select-none active:cursor-grabbing",
        className
      )}
      onPointerCancel={stopDragging}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      ref={containerRef}
      role="img"
    >
      <div className="absolute inset-0" ref={hostRef} />
      <div className="pointer-events-none absolute inset-0">
        {globeTags.map((tag) => {
          const isOpen = openTagId === tag.id;

          return (
            <button
              aria-expanded={isOpen}
              className={cn(
                "pointer-events-auto absolute top-0 left-0 overflow-hidden rounded-md border bg-background/90 px-2.5 py-1.5 text-left font-medium text-foreground text-xs opacity-0 shadow-sm backdrop-blur-sm transition-[opacity,background-color,border-color,box-shadow] duration-200 ease-out",
                isOpen
                  ? "z-20 border-foreground/15 bg-background/95 shadow-md"
                  : "z-10 border-border hover:bg-background"
              )}
              data-globe-tag={tag.id}
              key={tag.id}
              onClick={() => {
                setOpenTagId(isOpen ? null : tag.id);
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              ref={(element) => {
                if (element) {
                  tagButtonRefs.current.set(tag.id, element);
                } else {
                  tagButtonRefs.current.delete(tag.id);
                }
              }}
              type="button"
            >
              <span>{tag.label}</span>
              <span
                className={cn(
                  "block max-h-0 w-0 max-w-0 translate-y-1 overflow-hidden whitespace-nowrap font-normal text-muted-foreground opacity-0 transition-[max-height,max-width,opacity,transform,width] duration-200 ease-out",
                  isOpen
                    ? "mt-1 max-h-8 w-max max-w-40 translate-y-0 opacity-100"
                    : "mt-0 max-h-0 translate-y-1 opacity-0"
                )}
              >
                {tag.detail}
              </span>
            </button>
          );
        })}
      </div>
      <p className="pointer-events-none absolute right-5 bottom-5 whitespace-nowrap font-normal text-muted-foreground text-xs">
        Next 24 hour snowfall forecast
      </p>
      <span className="sr-only" id="cobe-globe-instructions">
        Drag the globe to rotate it.
      </span>
    </div>
  );
}
