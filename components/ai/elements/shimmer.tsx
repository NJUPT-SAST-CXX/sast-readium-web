"use client";

import { cn } from "@/lib/utils";
import { motion, type MotionProps } from "motion/react";
import {
  type CSSProperties,
  type ElementType,
  type ComponentType,
  memo,
  useMemo,
} from "react";

export type TextShimmerProps = {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

// Pre-created motion components for common tags
const MotionP = motion.p;
const MotionSpan = motion.span;
const MotionDiv = motion.div;
const MotionH1 = motion.h1;
const MotionH2 = motion.h2;
const MotionH3 = motion.h3;

type MotionComponentType = ComponentType<
  MotionProps &
    React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>;

const motionComponents: Record<string, MotionComponentType> = {
  p: MotionP as MotionComponentType,
  span: MotionSpan as MotionComponentType,
  div: MotionDiv as MotionComponentType,
  h1: MotionH1 as MotionComponentType,
  h2: MotionH2 as MotionComponentType,
  h3: MotionH3 as MotionComponentType,
};

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const tag = typeof Component === "string" ? Component : "p";
  const MotionComponent = motionComponents[tag] || MotionP;

  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  return (
    <MotionComponent
      animate={{ backgroundPosition: "0% center" }}
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage:
            "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
        } as CSSProperties
      }
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration,
        ease: "linear",
      }}
    >
      {children}
    </MotionComponent>
  );
};

export const Shimmer = memo(ShimmerComponent);
