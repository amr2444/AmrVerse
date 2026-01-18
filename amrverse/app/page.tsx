"use client"

import { Button } from "@/components/ui/button"
import { Users, Zap, MessageCircle, Crown, Sparkles, ArrowRight, Flame, BookOpen, Play, Star, TrendingUp, Heart, Eye } from "lucide-react"
import { Logo } from "@/components/logo"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activePanel, setActivePanel] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Auto-rotate featured panels
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePanel((prev) => (prev + 1) % 3)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-gradient-to-r from-background/95 to-background/90 backdrop-blur-xl border-b border-primary/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo onClick={() => window.location.href = "/"} />
          <div className="hidden md:flex gap-8 text-sm">
            <a href="#stories" className="text-foreground/70 hover:text-primary transition-colors font-medium">
              Stories
            </a>
            <a href="#experience" className="text-foreground/70 hover:text-primary transition-colors font-medium">
              Experience
            </a>
            <a href="#community" className="text-foreground/70 hover:text-primary transition-colors font-medium">
              Community
            </a>
            <a href="#creators" className="text-foreground/70 hover:text-primary transition-colors font-medium">
              Creators
            </a>
          </div>
          <Button
            onClick={() => typeof window !== "undefined" && (window.location.href = "/auth")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-full px-6 shadow-lg shadow-primary/20"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section - Manga Style */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center">
        {/* Animated manga-style background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Speed lines effect */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              rgba(236, 72, 153, 0.5) 50px,
              rgba(236, 72, 153, 0.5) 51px
            )`
          }}></div>
          
          {/* Glowing orbs */}
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-rose-500/15 to-fuchsia-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
          <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-3xl"></div>
          
          {/* Floating manga panels effect */}
          <div className="absolute top-32 right-20 w-20 h-28 border-2 border-fuchsia-500/20 rounded-lg rotate-12 opacity-30"></div>
          <div className="absolute bottom-40 left-20 w-16 h-24 border-2 border-purple-500/20 rounded-lg -rotate-6 opacity-30"></div>
          <div className="absolute top-60 left-1/3 w-12 h-16 border-2 border-rose-500/20 rounded-lg rotate-3 opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Immersive story text */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-block animate-fade-in">
                <div className="group px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-400/40 text-fuchsia-300 text-sm font-semibold flex items-center gap-2 hover:border-fuchsia-400/60 transition-all cursor-default">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>マンガの世界へようこそ</span>
                  <span className="text-fuchsia-400/60">•</span>
                  <span>Welcome to the Manhwa Universe</span>
                </div>
              </div>

              {/* Main Title */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
                  <span className="text-foreground">Read</span>
                  <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-rose-400 bg-clip-text text-transparent"> Together</span>
                  <br />
                  <span className="text-foreground">React</span>
                  <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent"> Together</span>
                </h1>
                
                <p className="text-lg md:text-xl text-foreground/70 max-w-xl leading-relaxed">
                  Plongez dans l'univers du manhwa. Lisez des chapitres synchronisés avec vos amis, 
                  discutez de chaque rebondissement en temps réel, et construisez une communauté autour des histoires que vous aimez.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => typeof window !== "undefined" && (window.location.href = "/auth")}
                  className="group relative bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white rounded-xl px-8 py-6 text-lg font-bold shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 transition-all duration-300 h-auto overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Commencer à Lire
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Button>
                <Button
                  onClick={() => typeof window !== "undefined" && (window.location.href = "/library")}
                  variant="outline"
                  className="group border-2 border-fuchsia-400/40 hover:border-fuchsia-400/70 hover:bg-fuchsia-500/10 text-foreground rounded-xl px-8 py-6 text-lg font-bold bg-transparent h-auto transition-all duration-300"
                >
                  <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explorer la Bibliothèque
                </Button>
              </div>

              {/* Stats - Manga panel style */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { value: "50K+", label: "Lecteurs Actifs", icon: Users, color: "fuchsia" },
                  { value: "200+", label: "Titres Manhwa", icon: BookOpen, color: "purple" },
                  { value: "∞", label: "Moments Partagés", icon: Heart, color: "rose" },
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className="group relative bg-gradient-to-br from-card/60 to-card/20 border border-fuchsia-500/20 rounded-xl p-4 hover:border-fuchsia-500/40 transition-all duration-300 cursor-default"
                  >
                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-${stat.color}-500/10 flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 text-${stat.color}-400/60`} />
                    </div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-foreground/50 text-xs mt-1 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Manga Panel Showcase */}
            <div className="relative hidden lg:block">
              {/* Main featured panel */}
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-rose-500/20 rounded-3xl blur-2xl opacity-60"></div>
                
                {/* Main panel container */}
                <div className="relative bg-gradient-to-br from-slate-900/90 to-purple-950/90 border-2 border-fuchsia-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-fuchsia-500/10">
                  {/* Panel header */}
                  <div className="bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 px-4 py-3 border-b border-fuchsia-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-pulse"></div>
                      <span className="text-fuchsia-300 text-sm font-bold">LIVE READING</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/50 text-xs">
                      <Eye className="w-3 h-3" />
                      <span>1,234 watching</span>
                    </div>
                  </div>
                  
                  {/* Panel content - Simulated manga pages */}
                  <div className="relative h-80 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5"></div>
                    
                    {/* Stacked manga pages effect */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`absolute w-48 h-64 bg-gradient-to-br from-card to-card/80 border-2 rounded-lg shadow-xl transition-all duration-500 ${
                            activePanel === i 
                              ? "border-fuchsia-400 scale-100 z-30 rotate-0" 
                              : i < activePanel 
                                ? "border-purple-500/30 scale-90 -rotate-6 -translate-x-8 z-10 opacity-60"
                                : "border-purple-500/30 scale-90 rotate-6 translate-x-8 z-20 opacity-60"
                          }`}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <BookOpen className={`w-12 h-12 mb-3 ${activePanel === i ? "text-fuchsia-400" : "text-purple-500/50"}`} />
                            <div className="text-center">
                              <p className={`font-bold ${activePanel === i ? "text-foreground" : "text-foreground/50"}`}>
                                Chapter {i + 1}
                              </p>
                              <p className="text-xs text-foreground/40 mt-1">Solo Leveling</p>
                            </div>
                          </div>
                          {activePanel === i && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center">
                              <Play className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Panel footer - User avatars */}
                  <div className="px-4 py-3 border-t border-fuchsia-500/20 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-fuchsia-500/30 border-2 border-background flex items-center justify-center text-xs text-fuchsia-300">
                        +12
                      </div>
                    </div>
                    <Button size="sm" className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-xs rounded-full px-4">
                      Rejoindre
                    </Button>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-fuchsia-500 rounded-full text-white text-xs font-bold shadow-lg animate-bounce">
                🔥 Trending
              </div>
              
              <div className="absolute -bottom-4 -right-4 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full text-white text-xs font-bold shadow-lg">
                <Star className="w-3 h-3 inline mr-1" />
                4.9
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-foreground/40 text-xs">Scroll</span>
          <div className="w-5 h-8 border-2 border-foreground/20 rounded-full flex justify-center pt-1">
            <div className="w-1 h-2 bg-fuchsia-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Trending Stories Section */}
      <section id="stories" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 border border-rose-400/30">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 text-sm font-semibold">今週のトレンド • Trending This Week</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-foreground">
              Histoires <span className="bg-gradient-to-r from-fuchsia-400 to-rose-400 bg-clip-text text-transparent">Populaires</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
              Découvrez les manhwas les plus captivants du moment, choisis par notre communauté
            </p>
          </div>

          {/* Manhwa Grid - Manga panel style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Solo Leveling", 
                genre: "Action/Fantasy", 
                rating: 4.9, 
                readers: "125K", 
                status: "Ongoing", 
                color: "fuchsia",
                gradient: "from-indigo-900 via-purple-900 to-slate-900",
                accent: "from-blue-500 to-purple-600",
                symbol: "⚔️",
                pattern: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, transparent 50%), linear-gradient(225deg, rgba(139, 92, 246, 0.3) 0%, transparent 50%)"
              },
              { 
                title: "Tower of God", 
                genre: "Adventure", 
                rating: 4.8, 
                readers: "98K", 
                status: "Ongoing", 
                color: "purple",
                gradient: "from-amber-900 via-orange-900 to-slate-900",
                accent: "from-amber-500 to-orange-600",
                symbol: "🗼",
                pattern: "linear-gradient(0deg, rgba(245, 158, 11, 0.2) 0%, transparent 60%), repeating-linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0px, rgba(251, 191, 36, 0.1) 2px, transparent 2px, transparent 20px)"
              },
              { 
                title: "The Beginning After The End", 
                genre: "Fantasy", 
                rating: 4.9, 
                readers: "87K", 
                status: "Ongoing", 
                color: "rose",
                gradient: "from-cyan-900 via-teal-900 to-slate-900",
                accent: "from-cyan-500 to-teal-600",
                symbol: "👑",
                pattern: "radial-gradient(circle at 30% 70%, rgba(34, 211, 238, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(20, 184, 166, 0.3) 0%, transparent 50%)"
              },
              { 
                title: "Omniscient Reader", 
                genre: "Action", 
                rating: 4.7, 
                readers: "76K", 
                status: "Completed", 
                color: "violet",
                gradient: "from-rose-900 via-red-900 to-slate-900",
                accent: "from-rose-500 to-red-600",
                symbol: "📖",
                pattern: "linear-gradient(45deg, rgba(244, 63, 94, 0.2) 0%, transparent 40%), linear-gradient(-45deg, rgba(239, 68, 68, 0.2) 0%, transparent 40%)"
              },
            ].map((manhwa, i) => (
              <div 
                key={i} 
                className="group cursor-pointer"
                onClick={() => typeof window !== "undefined" && (window.location.href = "/library")}
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-500 h-[420px] bg-gradient-to-br from-slate-900/80 to-purple-950/80 group-hover:shadow-2xl group-hover:shadow-fuchsia-500/20 group-hover:scale-[1.02] transform">
                  {/* Manga-style corner decoration */}
                  <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden z-10">
                    <div className={`absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br ${manhwa.accent} rotate-45`}></div>
                    <span className="absolute top-1 left-1 text-white text-xs font-bold">#{i + 1}</span>
                  </div>

                  {/* Stylized Cover placeholder */}
                  <div className={`relative h-56 bg-gradient-to-br ${manhwa.gradient} flex items-center justify-center overflow-hidden`}>
                    {/* Pattern overlay */}
                    <div className="absolute inset-0" style={{ backgroundImage: manhwa.pattern }}></div>
                    
                    {/* Animated lines effect */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
                      <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
                      <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"></div>
                    </div>
                    
                    {/* Central symbol */}
                    <div className="relative flex flex-col items-center justify-center">
                      <span className="text-6xl mb-2 group-hover:scale-125 transition-transform duration-500 drop-shadow-lg">{manhwa.symbol}</span>
                      <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${manhwa.accent} group-hover:w-24 transition-all duration-500`}></div>
                    </div>
                    
                    {/* Decorative corner elements */}
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg"></div>
                    
                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${manhwa.accent} opacity-0 group-hover:opacity-80 transition-opacity duration-300 flex items-end justify-center pb-4`}>
                      <Button size="sm" className="bg-white text-slate-900 font-bold rounded-full px-6 hover:bg-slate-100 shadow-lg">
                        <Play className="w-4 h-4 mr-1" /> Lire
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-fuchsia-300 transition-colors line-clamp-1">
                          {manhwa.title}
                        </h3>
                        <p className="text-foreground/50 text-sm">{manhwa.genre}</p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-amber-300 text-xs font-bold">{manhwa.rating}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-fuchsia-500/10">
                      <div className="flex items-center gap-1 text-foreground/40 text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{manhwa.readers}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        manhwa.status === "Ongoing" 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {manhwa.status}
                      </div>
                    </div>
                  </div>

                  {/* Fire indicator for hot series */}
                  {i < 2 && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full">
                      <Flame className="w-3 h-3 text-white" />
                      <span className="text-white text-xs font-bold">HOT</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Button 
              onClick={() => typeof window !== "undefined" && (window.location.href = "/library")}
              variant="outline"
              className="group border-2 border-fuchsia-400/40 hover:border-fuchsia-400/70 hover:bg-fuchsia-500/10 text-foreground rounded-xl px-8 py-6 text-lg font-bold bg-transparent h-auto"
            >
              Voir Toute la Bibliothèque
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-purple-950/10 to-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-px h-32 bg-gradient-to-b from-transparent via-fuchsia-500/30 to-transparent"></div>
          <div className="absolute top-1/2 right-0 w-px h-32 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">体験 • The Experience</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-foreground">
              Trois <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Piliers</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
              Une expérience de lecture synchronisée unique au monde
            </p>
          </div>

          {/* Features Grid - Manga Panel Style */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Lecture Immersive",
                titleJp: "没入型リーディング",
                desc: "Scrollez verticalement à travers des chapitres magnifiquement formatés avec un espacement et une typographie optimisés pour l'expérience webtoon.",
                color: "fuchsia",
                number: "01"
              },
              {
                icon: Users,
                title: "Lecture Synchronisée",
                titleJp: "同期ビューイング",
                desc: "Lisez au même rythme que vos amis. Tout le monde scrolle ensemble, créant une expérience de visionnage unifiée à travers les distances.",
                color: "purple",
                number: "02"
              },
              {
                icon: MessageCircle,
                title: "Réactions en Direct",
                titleJp: "リアルタイム反応",
                desc: "Discutez de chaque panel, chaque rebondissement. Réagissez aux moments forts en temps réel et construisez des connexions plus profondes.",
                color: "violet",
                number: "03"
              },
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className={`relative bg-gradient-to-br from-slate-900/80 to-${feature.color}-950/40 border-2 border-${feature.color}-500/20 rounded-2xl p-8 hover:border-${feature.color}-500/50 transition-all duration-500 h-full hover:shadow-xl hover:shadow-${feature.color}-500/10 hover:-translate-y-2`}>
                  {/* Number badge */}
                  <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-sm">{feature.number}</span>
                  </div>

                  {/* Icon with glow */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-${feature.color}-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-500/5 border border-${feature.color}-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-8 h-8 text-${feature.color}-400`} />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-foreground mb-1 group-hover:text-fuchsia-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className={`text-${feature.color}-400/60 text-xs font-medium tracking-wider`}>
                      {feature.titleJp}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-foreground/60 leading-relaxed">
                    {feature.desc}
                  </p>

                  {/* Decorative line */}
                  <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-${feature.color}-500/30 to-transparent`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-rose-500/20 border border-fuchsia-400/30">
                <Users className="w-4 h-4 text-fuchsia-400" />
                <span className="text-fuchsia-300 text-sm font-semibold">コミュニティ • Community</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
                  Une Communauté
                  <br />
                  <span className="bg-gradient-to-r from-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
                    Passionnée
                  </span>
                </h2>
                <p className="text-lg text-foreground/70 leading-relaxed max-w-xl">
                  Rejoignez des milliers de lecteurs qui partagent votre passion pour le manhwa. 
                  Faites-vous des amis, discutez de théories et célébrez vos séries préférées ensemble.
                </p>
              </div>

              {/* Feature list with manga-style bullets */}
              <div className="space-y-4">
                {[
                  { text: "Créez des cercles de lecture avec vos amis", icon: Users },
                  { text: "Découvrez des créateurs et connectez directement", icon: Crown },
                  { text: "Accédez à des discussions exclusives", icon: MessageCircle },
                  { text: "Participez à des événements en direct", icon: Zap },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/5 border border-fuchsia-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <p className="text-foreground/80 font-medium group-hover:text-fuchsia-300 transition-colors">{item.text}</p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => typeof window !== "undefined" && (window.location.href = "/auth")}
                className="group bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-600 hover:to-rose-600 text-white rounded-xl px-8 py-6 text-lg font-bold shadow-lg shadow-fuchsia-500/25 h-auto"
              >
                Rejoindre la Communauté
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Right: Community showcase - Manga panel grid */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/10 to-rose-500/10 rounded-3xl blur-2xl"></div>
              
              <div className="relative grid grid-cols-2 gap-4">
                {/* Active Rooms Card */}
                <div className="group bg-gradient-to-br from-slate-900/90 to-fuchsia-950/50 border-2 border-fuchsia-500/30 rounded-2xl p-6 h-52 flex flex-col justify-between hover:border-fuchsia-500/50 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-fuchsia-300">247</p>
                    <p className="text-foreground/50 text-sm">Rooms Actives</p>
                  </div>
                </div>

                {/* Top Readers Card */}
                <div className="group bg-gradient-to-br from-slate-900/90 to-purple-950/50 border-2 border-purple-500/30 rounded-2xl p-6 h-36 mt-8 flex flex-col justify-between hover:border-purple-500/50 transition-all duration-300">
                  <Crown className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="text-foreground/70 text-sm font-medium">Top Lecteurs</p>
                    <div className="flex -space-x-2 mt-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 border-2 border-background"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trending Card */}
                <div className="group bg-gradient-to-br from-slate-900/90 to-rose-950/50 border-2 border-rose-500/30 rounded-2xl p-6 h-36 flex flex-col justify-between hover:border-rose-500/50 transition-all duration-300">
                  <Sparkles className="w-6 h-6 text-rose-400" />
                  <div>
                    <p className="text-foreground/70 text-sm font-medium">Trending Now</p>
                    <p className="text-rose-300 text-xs mt-1">Solo Leveling Ch.180</p>
                  </div>
                </div>

                {/* Live Events Card */}
                <div className="group bg-gradient-to-br from-slate-900/90 to-violet-950/50 border-2 border-violet-500/30 rounded-2xl p-6 h-52 flex flex-col justify-between hover:border-violet-500/50 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-green-400 text-xs font-bold">LIVE</span>
                  </div>
                  <div>
                    <Zap className="w-8 h-8 text-violet-400 mb-2" />
                    <p className="text-foreground/70 text-sm font-medium">Événements Live</p>
                    <p className="text-violet-300 text-xs mt-1">3 sessions en cours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creators Section */}
      <section id="creators" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-950/20 via-background to-background relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Creator showcase - Dashboard preview */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-3xl blur-2xl"></div>
              
              <div className="relative bg-gradient-to-br from-slate-900/95 to-purple-950/80 border-2 border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl">
                {/* Dashboard header */}
                <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold text-sm">Creator Studio</p>
                      <p className="text-foreground/50 text-xs">Dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-green-400 text-xs font-medium">Pro</span>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6 space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Vues", value: "125.4K", trend: "+12%" },
                      { label: "Abonnés", value: "8.2K", trend: "+5%" },
                      { label: "Revenus", value: "€2.4K", trend: "+18%" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                        <p className="text-foreground/50 text-xs">{stat.label}</p>
                        <p className="text-foreground font-bold">{stat.value}</p>
                        <p className="text-green-400 text-xs">{stat.trend}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent uploads */}
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-foreground/70 text-xs font-medium mb-3">Derniers Uploads</p>
                    <div className="space-y-2">
                      {["Chapter 45 - Published", "Chapter 44 - 12K views", "Chapter 43 - 15K views"].map((ch, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                          <span className="text-foreground/60">{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl font-bold">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Upload New Chapter
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Creator text */}
            <div className="space-y-8 order-1 lg:order-2">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30">
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-semibold">クリエイター • For Creators</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
                  Par les Créateurs,
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                    Pour les Créateurs
                  </span>
                </h2>
                <p className="text-lg text-foreground/70 leading-relaxed max-w-xl">
                  Les artistes et écrivains indépendants ont maintenant une plateforme pour monétiser leur travail. 
                  Uploadez votre manhwa, construisez votre fanbase et gagnez directement de votre communauté passionnée.
                  Comme mon collègue ElBattah Ahmed qui est un créateur débutant et AmrVerse est son point de départ (Bonne chance à tous!!).
                </p>
              </div>

              {/* Feature list */}
              <div className="space-y-4">
                {[
                  { text: "Uploadez des chapitres et séries illimités", icon: BookOpen },
                  { text: "Revenus directs de votre fanbase", icon: Zap },
                  { text: "Analytics et outils avancés", icon: TrendingUp },
                  { text: "Support créateur dédié", icon: Heart },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-foreground/80 font-medium group-hover:text-purple-300 transition-colors">{item.text}</p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => typeof window !== "undefined" && (window.location.href = "/auth")}
                className="group bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl px-8 py-6 text-lg font-bold shadow-lg shadow-purple-500/25 h-auto"
              >
                Devenir Créateur
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative bg-gradient-to-br from-slate-900/90 to-fuchsia-950/50 border-2 border-fuchsia-500/30 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
            
            {/* Manga-style corner decorations */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-fuchsia-500/40"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-fuchsia-500/40"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-fuchsia-500/40"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-fuchsia-500/40"></div>

            <div className="relative z-10 space-y-6">
              {/* Japanese text accent */}
              <p className="text-fuchsia-400/60 text-sm font-medium tracking-widest">革命に参加する準備はできましたか？</p>
              
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                Prêt à Rejoindre la
                <br />
                <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                  Révolution Manhwa ?
                </span>
              </h2>
              
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                Commencez à lire avec vos amis dès aujourd'hui. Créez votre première room et vivez une expérience de lecture synchronisée unique.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  onClick={() => typeof window !== "undefined" && (window.location.href = "/auth")}
                  className="group relative bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white rounded-xl px-10 py-6 text-lg font-bold shadow-lg shadow-fuchsia-500/25 h-auto overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Commencer Gratuitement
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Button>
                <Button
                  onClick={() => typeof window !== "undefined" && (window.location.href = "/library")}
                  variant="outline"
                  className="border-2 border-fuchsia-400/40 hover:border-fuchsia-400/70 hover:bg-fuchsia-500/10 text-foreground rounded-xl px-10 py-6 text-lg font-bold bg-transparent h-auto"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Voir la Démo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-fuchsia-500/20 bg-gradient-to-b from-background to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <Logo size="sm" />
              <p className="text-foreground/50 text-sm leading-relaxed">
                Lecture synchronisée pour la communauté mondiale de manhwa. Read Together, React Together.
              </p>
              <p className="text-fuchsia-400/60 text-xs">マンガの世界 • Le monde du manga</p>
            </div>
            
            {/* Platform Links */}
            <div className="space-y-4">
              <h4 className="text-foreground font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-fuchsia-400" />
                Plateforme
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Bibliothèque", href: "/library" },
                  { label: "Créer une Room", href: "/reading-room/create" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-foreground/50 hover:text-fuchsia-400 transition-colors text-sm flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-fuchsia-500/50 group-hover:bg-fuchsia-400 transition-colors"></span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Creator Links */}
            <div className="space-y-4">
              <h4 className="text-foreground font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-400" />
                Créateurs
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Creator Studio", href: "/admin/upload-content" },
                  { label: "Upload Manhwa", href: "/admin/upload-content" },
                  { label: "Support", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-foreground/50 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors"></span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Social & Connect */}
            <div className="space-y-4">
              <h4 className="text-foreground font-bold flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-rose-400" />
                Connecter
              </h4>
              <div className="flex gap-3">
                {[
                  { name: "GitHub", href: "https://github.com/amr2444", color: "bg-slate-500/20 hover:bg-slate-500/30 text-slate-300" },
                  { name: "LinkedIn", href: "https://www.linkedin.com/in/amr-elbellaoui-73056b27b", color: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400" },
                ].map((social) => (
                  <a 
                    key={social.name} 
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${social.color}`}
                  >
                    {social.name}
                  </a>
                ))}
              </div>
              <p className="text-foreground/40 text-xs pt-2">
                Rejoignez notre communauté de +50K lecteurs
              </p>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-fuchsia-500/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-foreground/40 text-sm">
              © 2026 AmrVerse. Créé avec ❤️ pour les fans de manhwa du monde entier.
            </p>
            <div className="flex items-center gap-4 text-foreground/40 text-xs">
              <a href="#" className="hover:text-fuchsia-400 transition-colors">Confidentialité</a>
              <span>•</span>
              <a href="#" className="hover:text-fuchsia-400 transition-colors">Conditions</a>
              <span>•</span>
              <a href="#" className="hover:text-fuchsia-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom styles */}
      <style jsx global>{`
        /* Custom scrollbar - Manga style */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 15, 20, 0.8);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(236, 72, 153, 0.5) 0%, rgba(168, 85, 247, 0.4) 100%);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(236, 72, 153, 0.7) 0%, rgba(168, 85, 247, 0.6) 100%);
        }

        /* Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        /* Selection color */
        ::selection {
          background: rgba(236, 72, 153, 0.3);
          color: white;
        }
      `}</style>
    </div>
  )
}
