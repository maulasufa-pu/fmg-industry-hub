"use client";

import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Music, 
  Users, 
  Award,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  Star,
  Headphones,
  Mic2,
  Radio,
  Disc3
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Parallax } from "react-scroll-parallax";

// Types
type ProjectCategory = 'all' | 'production' | 'mixing' | 'mastering' | 'songwriting' | 'publishing';

type ProjectStatus = 'released' | 'upcoming' | 'in-progress';

interface Project {
  id: string;
  title: string;
  artist: string;
  category: ProjectCategory;
  status: ProjectStatus;
  releaseDate: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  awards?: string[];
  credits: string[];
  stats: {
    streams?: number;
    awards?: number;
    charts?: string[];
  };
}

// Sample portfolio data
const PORTFOLIO_PROJECTS: Project[] = [
  {
    id: "viokichi-you-are-enough",
    title: "You Are Enough",
    artist: "Viokichi",
    category: "production",
    status: "released",
    releaseDate: "2024-03-15",
    description: "A powerful pop ballad about self-acceptance and inner strength. Full production from concept to master.",
    imageUrl: "/img/alfath-flemmo-founder-ceo-flemmo-music-global-publishing-fmg-universe.jpeg",
    audioUrl: "/audio/previews/viokichi-you-are-enough-preview.mp3",
    spotifyUrl: "https://open.spotify.com/track/example",
    youtubeUrl: "https://youtube.com/watch?v=example",
    credits: ["Production", "Arrangement", "Mixing", "Mastering"],
    stats: {
      streams: 250000,
      charts: ["Indonesia Top 50", "Southeast Asia Viral"]
    }
  },
  {
    id: "nannouz-jazz-collection",
    title: "Modern Jazz Collection",
    artist: "Nannouz", 
    category: "mixing",
    status: "released",
    releaseDate: "2024-01-20",
    description: "Contemporary jazz album featuring orchestral arrangements and modern production techniques.",
    imageUrl: "/img/logo/Flemmo-Music-Global-FMG-Publishing-logo.jpg",
    credits: ["Mixing", "Additional Production"],
    stats: {
      streams: 180000,
      awards: 1,
      charts: ["Jazz Charts Indonesia"]
    }
  },
  {
    id: "besThree-electronic-dreams",
    title: "Electronic Dreams EP",
    artist: "BesThree",
    category: "mastering", 
    status: "released",
    releaseDate: "2024-02-10",
    description: "4-track electronic EP with cutting-edge sound design and crystal-clear masters.",
    imageUrl: "/img/logo/FMG-Universe-Flemmo-Music-Global.png",
    credits: ["Mastering", "Sound Design"],
    stats: {
      streams: 320000,
      charts: ["Electronic Indonesia", "EDM Rising"]
    }
  },
  {
    id: "amandha-bossa-nova",
    title: "Sunset Bossa",
    artist: "Amandha Ayu",
    category: "songwriting",
    status: "released", 
    releaseDate: "2023-11-05",
    description: "Smooth bossa nova single with Portuguese and Indonesian lyrics.",
    imageUrl: "/img/logo/Flemmo-Enterprise-Music-FEM-logo.jpg",
    credits: ["Songwriting", "Arrangement", "Production"],
    stats: {
      streams: 150000,
      charts: ["Bossa Nova Indonesia"]
    }
  },
  {
    id: "adilisius-pop-fusion",
    title: "Cross Language",
    artist: "Adilisius",
    category: "publishing",
    status: "released",
    releaseDate: "2024-04-02", 
    description: "Multilingual pop fusion track distributed across 150+ countries.",
    imageUrl: "/img/alfath-flemmo-founder-ceo-flemmo-music-global-publishing-fmg-universe.jpeg",
    credits: ["Publishing", "Distribution", "Rights Management"],
    stats: {
      streams: 280000,
      charts: ["Global Indonesia", "World Music Charts"]
    }
  },
  {
    id: "anthem-boys-upcoming",
    title: "New Horizons",
    artist: "Anthem Boys",
    category: "production",
    status: "upcoming",
    releaseDate: "2024-12-15",
    description: "Highly anticipated pop-EDM collaboration featuring international artists.",
    imageUrl: "/img/logo/Flemmo-Music-Global-FMG-Publishing-logo.jpg", 
    credits: ["Production", "Arrangement", "Mixing"],
    stats: {
      streams: 0
    }
  }
];

const CATEGORIES = [
  { id: 'all' as const, label: 'All Projects', icon: Disc3 },
  { id: 'production' as const, label: 'Production', icon: Music },
  { id: 'mixing' as const, label: 'Mixing', icon: Headphones },
  { id: 'mastering' as const, label: 'Mastering', icon: Radio },
  { id: 'songwriting' as const, label: 'Songwriting', icon: Mic2 },
  { id: 'publishing' as const, label: 'Publishing', icon: Award }
];

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Main Portfolio Component  
export default function PortfolioClient(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Filter projects
  const filteredProjects = PORTFOLIO_PROJECTS.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Audio controls
  const toggleAudio = useCallback((projectId: string) => {
    setPlayingAudio(current => current === projectId ? null : projectId);
  }, []);

  const formatStreams = (streams: number): string => {
    if (streams >= 1000000) return `${(streams / 1000000).toFixed(1)}M`;
    if (streams >= 1000) return `${(streams / 1000).toFixed(1)}K`;
    return streams.toString();
  };

  return (
    <main className="relative min-h-screen bg-white text-black antialiased dark:bg-black dark:text-white">
      {/* Background texture */}
      <div className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.06] mix-blend-soft-light" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20"
        />
        
        <Parallax speed={0.05}>
          <div className="relative mx-auto max-w-6xl px-4 text-center">
            <motion.div
              initial="hidden"
              animate="visible" 
              variants={stagger}
              className="space-y-8"
            >
              <motion.h1 
                variants={fadeUp}
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
              >
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Our
                </span>{" "}
                <span className="text-slate-900 dark:text-white">
                  Portfolio
                </span>
              </motion.h1>

              <motion.p 
                variants={fadeUp}
                custom={1}
                className="mx-auto max-w-3xl text-lg sm:text-xl text-slate-600 dark:text-slate-300"
              >
                Discover the stories behind our music. From intimate songwriting sessions to
                massive productions, explore the projects that define our creative journey.
              </motion.p>

              <motion.div 
                variants={fadeUp}
                custom={2}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>50+ Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>25+ Artists</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>10M+ Streams</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </Parallax>
      </section>

      {/* Filter Section */}
      <section className="relative py-12 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={[
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  ].join(" ")}
                >
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="relative py-12">
        <div className="mx-auto max-w-6xl px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${searchQuery}`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={stagger}
              className="grid gap-8 md:gap-12 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  isPlaying={playingAudio === project.id}
                  onToggleAudio={() => toggleAudio(project.id)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* No results */}
          {filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No projects found</h3>
              <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/50">
        <Parallax speed={0.03}>
          <div className="mx-auto max-w-4xl px-4 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-12"
            >
              <motion.h2 
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-bold"
              >
                Numbers That Speak
              </motion.h2>

              <motion.div 
                variants={fadeUp}
                custom={1}
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
              >
                {[
                  { label: "Total Projects", value: "50+", icon: Music },
                  { label: "Artists Worked", value: "25+", icon: Users },
                  { label: "Total Streams", value: "10M+", icon: Headphones },
                  { label: "Awards Won", value: "15+", icon: Award }
                ].map((stat, index) => (
                  <div key={index} className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </Parallax>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <Parallax speed={0.06}>
          <div className="mx-auto max-w-4xl px-4 text-center">
            <motion.div
              initial="hidden" 
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-8"
            >
              <motion.h2 
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-bold"
              >
                Ready to Create Your Story?
              </motion.h2>

              <motion.p 
                variants={fadeUp}
                custom={1}
                className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
              >
                Join the artists and creators who trust FMG Universe to bring their 
                vision to life. Let&apos;s create something extraordinary together.
              </motion.p>

              <motion.div 
                variants={fadeUp}
                custom={2}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                >
                  Start Your Project
                  <ExternalLink className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  View Services
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </Parallax>
      </section>
    </main>
  );
}

// Project Card Component
function ProjectCard({ 
  project, 
  isPlaying, 
  onToggleAudio 
}: { 
  project: Project;
  isPlaying: boolean;
  onToggleAudio: () => void;
}): React.JSX.Element {
  const formatStreams = (streams: number): string => {
    if (streams >= 1000000) return `${(streams / 1000000).toFixed(1)}M`;
    if (streams >= 1000) return `${(streams / 1000).toFixed(1)}K`;
    return streams.toString();
  };

  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case 'released': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500'; 
      case 'in-progress': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status: ProjectStatus): string => {
    switch (status) {
      case 'released': return 'Released';
      case 'upcoming': return 'Upcoming';
      case 'in-progress': return 'In Progress';
      default: return 'Unknown';
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        
        <Image
          src={project.imageUrl}
          alt={`${project.title} by ${project.artist}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 z-20 ${getStatusColor(project.status)} text-white text-xs font-medium px-3 py-1 rounded-full`}>
          {getStatusLabel(project.status)}
        </div>

        {/* Audio Control */}
        {project.audioUrl && (
          <button
            onClick={onToggleAudio}
            className="absolute bottom-4 right-4 z-20 w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            ) : (
              <Play className="w-5 h-5 text-slate-700 dark:text-slate-300 ml-0.5" />
            )}
          </button>
        )}

        {/* Overlay Content */}
        <div className="absolute bottom-4 left-4 z-20 text-white">
          <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
          <p className="text-white/80 text-sm">{project.artist}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
          {project.description}
        </p>

        {/* Credits */}
        <div className="flex flex-wrap gap-2">
          {project.credits.map((credit, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full"
            >
              {credit}
            </span>
          ))}
        </div>

        {/* Stats */}
        {project.stats.streams && project.stats.streams > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Headphones className="w-4 h-4" />
              <span>{formatStreams(project.stats.streams)} streams</span>
            </div>
            
            {project.stats.charts && project.stats.charts.length > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 text-xs">
                  {project.stats.charts.length} charts
                </span>
              </div>
            )}
          </div>
        )}

        {/* External Links */}
        <div className="flex gap-2 pt-2">
          {project.spotifyUrl && (
            <Link
              href={project.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              Spotify
            </Link>
          )}
          {project.youtubeUrl && (
            <Link
              href={project.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              YouTube
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}