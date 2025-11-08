"use client";

import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { getEffectiveRole } from "@/lib/roles/effective";
import type { UserRole } from "@/lib/roles";
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
  Plus
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Types matching SQL portfolio table schema
interface PortfolioItem {
  id: number;
  genre: string;
  song_title: string;
  album_title: string | null;
  singer: string[];
  songwriter: string[];
  composer: string[];
  arranger: string[];
  producer: string[];
  mixing_engineer: string[];
  mastering_engineer: string[];
  publisher: string[];
  aggregator: string[];
  release_date: string | null;
  youtube_link: string | null;
  spotify_artwork: string | null;
  youtube_thumbnail: string | null;
  apple_music_artwork: string | null;
  created_at: string;
  updated_at: string;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 items per page

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Check user role on mount
  useEffect(() => {
    getEffectiveRole().then(role => {
      setUserRole(role);
    });
  }, []);

  // Fetch portfolio data from API
  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio');
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      
      const result = await response.json();
      setPortfolioItems(result.data || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolioItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is admin or owner
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  // Filter projects
  const filteredProjects = portfolioItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.song_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.singer.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      </section>

      {/* Filter Section */}
      <section className="relative py-12 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, artist, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>

            {/* Add Portfolio Button (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Portfolio
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="relative py-12">
        <div className="mx-auto max-w-6xl px-4">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Loading portfolio...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={stagger}
                className="grid gap-8 md:gap-12 sm:grid-cols-2 lg:grid-cols-3"
              >
                {currentItems.map((item) => (
                  <PortfolioCard 
                    key={item.id}
                    item={item}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination Controls */}
          {!isLoading && filteredProjects.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Results Info */}
          {!isLoading && filteredProjects.length > 0 && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
            </p>
          )}

          {/* No results */}
          {!isLoading && filteredProjects.length === 0 && (
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
                { label: "Total Projects", value: portfolioItems.length.toString(), icon: Music },
                { label: "Artists", value: new Set(portfolioItems.flatMap(p => p.singer)).size.toString(), icon: Users },
                { label: "Genres", value: new Set(portfolioItems.map(p => p.genre)).size.toString(), icon: Headphones },
                { label: "Released", value: portfolioItems.filter(p => p.release_date).length.toString(), icon: Award }
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
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
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
      </section>

      {/* Add Portfolio Modal */}
      {isAddModalOpen && (
        <AddPortfolioModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchPortfolioData}
        />
      )}
    </main>
  );
}

// Add Portfolio Modal Component
function AddPortfolioModal({ 
  isOpen, 
  onClose,
  onSuccess
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    genre: '',
    song_title: '',
    album_title: '',
    singer: '',
    songwriter: '',
    composer: '',
    arranger: '',
    producer: '',
    mixing_engineer: '',
    mastering_engineer: '',
    publisher: '',
    aggregator: '',
    release_date: '',
    youtube_link: '',
    spotify_artwork: '',
    youtube_thumbnail: '',
    apple_music_artwork: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert comma-separated strings to arrays
      const payload = {
        genre: formData.genre,
        song_title: formData.song_title,
        album_title: formData.album_title || null,
        singer: formData.singer.split(',').map(s => s.trim()).filter(Boolean),
        songwriter: formData.songwriter.split(',').map(s => s.trim()).filter(Boolean),
        composer: formData.composer.split(',').map(s => s.trim()).filter(Boolean),
        arranger: formData.arranger.split(',').map(s => s.trim()).filter(Boolean),
        producer: formData.producer.split(',').map(s => s.trim()).filter(Boolean),
        mixing_engineer: formData.mixing_engineer.split(',').map(s => s.trim()).filter(Boolean),
        mastering_engineer: formData.mastering_engineer.split(',').map(s => s.trim()).filter(Boolean),
        publisher: formData.publisher.split(',').map(s => s.trim()).filter(Boolean),
        aggregator: formData.aggregator.split(',').map(s => s.trim()).filter(Boolean),
        release_date: formData.release_date || null,
        youtube_link: formData.youtube_link || null,
        spotify_artwork: formData.spotify_artwork || null,
        youtube_thumbnail: formData.youtube_thumbnail || null,
        apple_music_artwork: formData.apple_music_artwork || null
      };

      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to add portfolio');

      alert('Portfolio added successfully!');
      onSuccess(); // Refresh data
      onClose();
    } catch (error) {
      console.error('Error adding portfolio:', error);
      alert('Failed to add portfolio. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-bold">Add New Portfolio</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Genre */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="genre"
                required
                value={formData.genre}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Pop, Rock, Jazz"
              />
            </div>

            {/* Song Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Song Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="song_title"
                required
                value={formData.song_title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Song title"
              />
            </div>

            {/* Album Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Album Title</label>
              <input
                type="text"
                name="album_title"
                value={formData.album_title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Album name (optional)"
              />
            </div>

            {/* Release Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Release Date</label>
              <input
                type="date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Multi-value fields (comma-separated) */}
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For multiple values, separate with commas (e.g., "John Doe, Jane Smith")
            </p>

            {/* Singer */}
            <div>
              <label className="block text-sm font-medium mb-2">Singer(s)</label>
              <input
                type="text"
                name="singer"
                value={formData.singer}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Artist 1, Artist 2"
              />
            </div>

            {/* Songwriter */}
            <div>
              <label className="block text-sm font-medium mb-2">Songwriter(s)</label>
              <input
                type="text"
                name="songwriter"
                value={formData.songwriter}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Writer 1, Writer 2"
              />
            </div>

            {/* Composer */}
            <div>
              <label className="block text-sm font-medium mb-2">Composer(s)</label>
              <input
                type="text"
                name="composer"
                value={formData.composer}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Composer 1, Composer 2"
              />
            </div>

            {/* Arranger */}
            <div>
              <label className="block text-sm font-medium mb-2">Arranger(s)</label>
              <input
                type="text"
                name="arranger"
                value={formData.arranger}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Arranger 1, Arranger 2"
              />
            </div>

            {/* Producer */}
            <div>
              <label className="block text-sm font-medium mb-2">Producer(s)</label>
              <input
                type="text"
                name="producer"
                value={formData.producer}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Producer 1, Producer 2"
              />
            </div>

            {/* Mixing Engineer */}
            <div>
              <label className="block text-sm font-medium mb-2">Mixing Engineer(s)</label>
              <input
                type="text"
                name="mixing_engineer"
                value={formData.mixing_engineer}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Engineer 1, Engineer 2"
              />
            </div>

            {/* Mastering Engineer */}
            <div>
              <label className="block text-sm font-medium mb-2">Mastering Engineer(s)</label>
              <input
                type="text"
                name="mastering_engineer"
                value={formData.mastering_engineer}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Engineer 1, Engineer 2"
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-sm font-medium mb-2">Publisher(s)</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Publisher 1, Publisher 2"
              />
            </div>

            {/* Aggregator */}
            <div>
              <label className="block text-sm font-medium mb-2">Aggregator(s)</label>
              <input
                type="text"
                name="aggregator"
                value={formData.aggregator}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Aggregator 1, Aggregator 2"
              />
            </div>

            {/* YouTube Link */}
            <div>
              <label className="block text-sm font-medium mb-2">YouTube Link</label>
              <input
                type="url"
                name="youtube_link"
                value={formData.youtube_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          {/* Artwork/Thumbnail URLs */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Artwork & Thumbnails
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide artwork/thumbnail URLs from streaming platforms (at least one recommended)
            </p>

            {/* Spotify Artwork */}
            <div>
              <label className="block text-sm font-medium mb-2">Spotify Artwork URL</label>
              <input
                type="url"
                name="spotify_artwork"
                value={formData.spotify_artwork}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://i.scdn.co/image/..."
              />
            </div>

            {/* YouTube Thumbnail */}
            <div>
              <label className="block text-sm font-medium mb-2">YouTube Thumbnail URL</label>
              <input
                type="url"
                name="youtube_thumbnail"
                value={formData.youtube_thumbnail}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://i.ytimg.com/vi/..."
              />
            </div>

            {/* Apple Music Artwork */}
            <div>
              <label className="block text-sm font-medium mb-2">Apple Music Artwork URL</label>
              <input
                type="url"
                name="apple_music_artwork"
                value={formData.apple_music_artwork}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://is1-ssl.mzstatic.com/image/..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Portfolio'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Portfolio Card Component for SQL data
const PortfolioCard = React.memo(function PortfolioCard({ 
  item
}: { 
  item: PortfolioItem;
}): React.JSX.Element {
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Artwork/Thumbnail logic with fallback priority: Spotify > YouTube > Apple Music > Default
  const getArtwork = (): string => {
    if (item.spotify_artwork) return item.spotify_artwork;
    if (item.youtube_thumbnail) return item.youtube_thumbnail;
    if (item.apple_music_artwork) return item.apple_music_artwork;
    return "/img/logo/FMG-Universe-Flemmo-Music-Global.png";
  };

  const artwork = getArtwork();
  const hasCustomArtwork = item.spotify_artwork || item.youtube_thumbnail || item.apple_music_artwork;

  return (
    <motion.div
      variants={fadeUp}
      className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        
        <Image
          src={artwork}
          alt={item.song_title}
          fill
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJhMmEzMiIvPjwvc3ZnPg=="
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${!hasCustomArtwork ? 'opacity-40' : ''}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={75}
        />

        {/* Genre Badge */}
        <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          {item.genre}
        </div>

        {/* Overlay Content */}
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.song_title}</h3>
          {item.singer.length > 0 && (
            <p className="text-white/80 text-sm line-clamp-1">{item.singer.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Album & Release Date */}
        <div className="space-y-2">
          {item.album_title && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Music className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{item.album_title}</span>
            </div>
          )}
          {item.release_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(item.release_date)}</span>
            </div>
          )}
        </div>

        {/* Credits Section */}
        <div className="space-y-2 text-xs">
          {item.composer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Composer: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.composer.join(', ')}</span>
            </div>
          )}
          {item.producer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Producer: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.producer.join(', ')}</span>
            </div>
          )}
          {item.mixing_engineer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Mixing: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.mixing_engineer.join(', ')}</span>
            </div>
          )}
          {item.mastering_engineer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Mastering: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.mastering_engineer.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Publisher & Aggregator Tags */}
        {(item.publisher.length > 0 || item.aggregator.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {item.publisher.map((pub, index) => (
              <span
                key={`pub-${index}`}
                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
              >
                {pub}
              </span>
            ))}
            {item.aggregator.map((agg, index) => (
              <span
                key={`agg-${index}`}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                {agg}
              </span>
            ))}
          </div>
        )}

        {/* YouTube Link */}
        {item.youtube_link && (
          <Link
            href={item.youtube_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Watch on YouTube
          </Link>
        )}
      </div>
    </motion.div>
  );
});