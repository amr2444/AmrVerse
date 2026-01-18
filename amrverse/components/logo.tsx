"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "default" | "creator" | "room"
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
  subtitle?: string
}

export function Logo({ variant = "default", size = "md", className, onClick, subtitle }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "gap-2",
      icon: 24,
      iconClass: "w-6 h-6",
      text: "text-lg",
      accent: "text-[10px]",
    },
    md: {
      container: "gap-2.5",
      icon: 36,
      iconClass: "w-9 h-9",
      text: "text-2xl",
      accent: "text-xs",
    },
    lg: {
      container: "gap-3",
      icon: 44,
      iconClass: "w-11 h-11",
      text: "text-3xl",
      accent: "text-sm",
    },
  }

  const getText = () => {
    switch (variant) {
      case "creator":
        return { main: "Creator", sub: "Studio" }
      case "room":
        return { main: "AmrVerse", sub: "Room" }
      default:
        return { main: "Amr", sub: "Verse" }
    }
  }

  const text = getText()
  const Wrapper = onClick ? "button" : "div"

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "group flex items-center",
        sizeClasses[size].container,
        onClick && "hover:scale-105 transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {/* Logo Icon with energy effect */}
      <div className="relative">
        {/* Outer glow ring - pulsing energy */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 blur-md opacity-60 group-hover:opacity-80 animate-pulse" />
        
        {/* Logo image with effects */}
        <div className={cn(
          "relative rounded-full overflow-hidden",
          "shadow-[0_0_15px_rgba(236,72,153,0.4)]",
          "group-hover:shadow-[0_0_25px_rgba(236,72,153,0.6)]",
          "transition-all duration-300",
          sizeClasses[size].iconClass
        )}>
          <Image
            src="/icon-dark-32x32.png"
            alt="AmrVerse Logo"
            width={sizeClasses[size].icon}
            height={sizeClasses[size].icon}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
            priority
          />
        </div>

        {/* Speed lines (manga effect) - visible on hover */}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col gap-0.5">
            <div className="w-3 h-[2px] bg-gradient-to-r from-fuchsia-400 to-transparent rounded-full" />
            <div className="w-4 h-[2px] bg-gradient-to-r from-rose-400 to-transparent rounded-full" />
            <div className="w-2 h-[2px] bg-gradient-to-r from-violet-400 to-transparent rounded-full" />
          </div>
        </div>
      </div>

      {/* Manga-style Typography */}
      <div className={cn("flex flex-col", subtitle && "gap-0.5")}>
        <div className="flex items-baseline gap-0.5">
          {/* Main text with manga-style gradient and effects */}
          <span
            className={cn(
              sizeClasses[size].text,
              "font-black tracking-tight",
              "bg-gradient-to-br from-white via-fuchsia-200 to-rose-300 bg-clip-text text-transparent",
              "drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]",
              "[text-shadow:_2px_2px_0px_rgba(139,69,219,0.3),_-1px_-1px_0px_rgba(255,255,255,0.1)]",
              "group-hover:[text-shadow:_2px_2px_0px_rgba(139,69,219,0.5),_-1px_-1px_0px_rgba(255,255,255,0.2),_0_0_30px_rgba(236,72,153,0.4)]",
              "transition-all duration-300"
            )}
            style={{
              fontFamily: "'Poppins', 'Noto Sans JP', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {text.main}
          </span>
          
          {/* Secondary text with accent style */}
          <span
            className={cn(
              sizeClasses[size].text,
              "font-black tracking-tight",
              "bg-gradient-to-br from-fuchsia-400 via-violet-400 to-purple-500 bg-clip-text text-transparent",
              "drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]",
              "group-hover:drop-shadow-[0_0_12px_rgba(167,139,250,0.7)]",
              "transition-all duration-300"
            )}
            style={{
              fontFamily: "'Poppins', 'Noto Sans JP', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {text.sub}
          </span>
        </div>

        {/* Japanese-style accent text */}
        {variant === "default" && (
          <span 
            className={cn(
              sizeClasses[size].accent,
              "font-medium tracking-[0.2em] uppercase",
              "bg-gradient-to-r from-fuchsia-400/80 to-violet-400/80 bg-clip-text text-transparent",
              "opacity-80 group-hover:opacity-100 transition-opacity"
            )}
          >
            マンガの世界
          </span>
        )}

        {/* Subtitle for room variant */}
        {subtitle && (
          <span className={cn(
            "text-xs font-medium tracking-wide",
            "bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent"
          )}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Decorative manga sparkles */}
      <div className="relative -ml-1">
        <svg 
          viewBox="0 0 24 24" 
          className={cn(
            "w-4 h-4 text-yellow-300 opacity-0 group-hover:opacity-100",
            "transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"
          )}
          fill="currentColor"
        >
          <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
        </svg>
      </div>
    </Wrapper>
  )
}
