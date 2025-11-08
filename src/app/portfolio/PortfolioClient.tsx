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
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  GripVertical,
  Grid3x3,
  List,
  ArrowUpDown
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  release_date_aggregator: string | null;
  spotify_link: string | null;
  youtube_link: string | null;
  apple_music_link: string | null;
  artwork_link: string | null;
  is_featured: boolean | null;
  priority_order: number | null;
  created_at: string;
  isrc_code: string | null;
  iswc_code: string | null;
  upc_code: string | null;
  duration_seconds: number | null;
  bpm: number | null;
  key_signature: string | null;
  language: string | null;
  explicit: boolean | null;
  lyrics: string | null;
  mood: string[] | null;
  theme: string[] | null;
  copyright_owner: string[] | null;
  phonographic_copyright_owner: string[] | null;
  collecting_society: string[] | null;
  rights_holder: string[] | null;
  licensing_info: string | null;
  distributor: string[] | null;
  platforms: string[] | null;
  release_country: string[] | null;
  release_type: string | null;
  format: string | null;
  registered_at: string;
  last_updated: string;
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
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedWorkType, setSelectedWorkType] = useState<string>('all');
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles');
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [editListItems, setEditListItems] = useState<PortfolioItem[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [genreSubGenres, setGenreSubGenres] = useState<Record<string, string[]>>({});
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
  const itemsPerPage = 12; // Show 12 items per page

  const heroRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const projectsGridRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(currentItems, oldIndex, newIndex);
        
        // Update priority_order for all affected items
        const updates = reorderedItems.map((item, index) => ({
          id: item.id,
          priority_order: (currentPage - 1) * itemsPerPage + index + 1
        }));

        // Optimistically update UI
        const newPortfolioItems = [...portfolioItems];
        updates.forEach(update => {
          const itemIndex = newPortfolioItems.findIndex(item => item.id === update.id);
          if (itemIndex !== -1) {
            newPortfolioItems[itemIndex] = {
              ...newPortfolioItems[itemIndex],
              priority_order: update.priority_order
            };
          }
        });
        setPortfolioItems(newPortfolioItems);

        // Send updates to server
        try {
          await Promise.all(
            updates.map(update =>
              fetch('/api/portfolio', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update),
              })
            )
          );
        } catch (error) {
          console.error('Error updating order:', error);
          // Revert on error
          fetchPortfolioData();
        }
      }
    }
  };

  // Handle drag end in Edit List Modal (all items without pagination)
  const handleEditListDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = editListItems.findIndex((item) => item.id === active.id);
      const newIndex = editListItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(editListItems, oldIndex, newIndex);
        
        // Update priority_order for ALL items (1 to N)
        const itemsWithNewOrder = reorderedItems.map((item, index) => ({
          ...item,
          priority_order: index + 1
        }));
        
        // Only update UI state, don't save to database yet
        setEditListItems(itemsWithNewOrder);
      }
    }
  };

  // Save Edit List changes to database
  const saveEditListChanges = async () => {
    try {
      const updates = editListItems.map((item, index) => ({
        id: item.id,
        priority_order: index + 1
      }));

      // Send updates to server
      await Promise.all(
        updates.map(update =>
          fetch('/api/portfolio', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          })
        )
      );
      
      // Close modal and reload
      setIsEditListModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  // Close genre dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    };

    if (showGenreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGenreDropdown]);

  // Check user role on mount
  useEffect(() => {
    getEffectiveRole().then(role => {
      setUserRole(role);
    });
  }, []);

  // Fetch portfolio data from API
  useEffect(() => {
    fetchPortfolioData();
    fetchMusicGenres();
  }, []);

  const fetchMusicGenres = async () => {
    try {
      const response = await fetch('/api/music-genres');
      if (response.ok) {
        const result = await response.json();
        setMusicGenres(result.data || []);
        setGenreSubGenres(result.genreMap || {});
      }
    } catch (error) {
      console.error('Error fetching music genres:', error);
    }
  };

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch portfolio: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Portfolio data fetched:', result);
      
      // Normalize data - ensure all array fields are arrays, not null
      const normalizedData = (result.data || [])
        .filter((item: any) => item && typeof item === 'object' && item.id) // Filter out invalid items
        .map((item: PortfolioItem) => ({
          ...item,
          // Ensure required string fields are strings
          song_title: item.song_title || 'Untitled',
          genre: item.genre || 'Unknown',
          // Ensure all array fields are arrays, not null
          singer: Array.isArray(item.singer) ? item.singer.filter(s => s && typeof s === 'string') : [],
          songwriter: Array.isArray(item.songwriter) ? item.songwriter.filter(s => s && typeof s === 'string') : [],
          composer: Array.isArray(item.composer) ? item.composer.filter(s => s && typeof s === 'string') : [],
          arranger: Array.isArray(item.arranger) ? item.arranger.filter(s => s && typeof s === 'string') : [],
          producer: Array.isArray(item.producer) ? item.producer.filter(s => s && typeof s === 'string') : [],
          mixing_engineer: Array.isArray(item.mixing_engineer) ? item.mixing_engineer.filter(s => s && typeof s === 'string') : [],
          mastering_engineer: Array.isArray(item.mastering_engineer) ? item.mastering_engineer.filter(s => s && typeof s === 'string') : [],
          publisher: Array.isArray(item.publisher) ? item.publisher.filter(s => s && typeof s === 'string') : [],
          aggregator: Array.isArray(item.aggregator) ? item.aggregator.filter(s => s && typeof s === 'string') : [],
          mood: Array.isArray(item.mood) ? item.mood.filter(s => s && typeof s === 'string') : [],
          theme: Array.isArray(item.theme) ? item.theme.filter(s => s && typeof s === 'string') : [],
          copyright_owner: Array.isArray(item.copyright_owner) ? item.copyright_owner.filter(s => s && typeof s === 'string') : [],
          phonographic_copyright_owner: Array.isArray(item.phonographic_copyright_owner) ? item.phonographic_copyright_owner.filter(s => s && typeof s === 'string') : [],
          collecting_society: Array.isArray(item.collecting_society) ? item.collecting_society.filter(s => s && typeof s === 'string') : [],
          rights_holder: Array.isArray(item.rights_holder) ? item.rights_holder.filter(s => s && typeof s === 'string') : [],
          distributor: Array.isArray(item.distributor) ? item.distributor.filter(s => s && typeof s === 'string') : [],
          platforms: Array.isArray(item.platforms) ? item.platforms.filter(s => s && typeof s === 'string') : [],
          release_country: Array.isArray(item.release_country) ? item.release_country.filter(s => s && typeof s === 'string') : [],
        }));
      
      console.log('Normalized portfolio data:', normalizedData.length, 'items');
      setPortfolioItems(normalizedData);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolioItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is admin or owner
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  // Get unique genres - prioritize musicGenres from database, fallback to portfolio items
  const availableGenres = musicGenres.length > 0 
    ? musicGenres 
    : Array.from(new Set(portfolioItems.map(item => item.genre).filter(Boolean))).sort();

  // Filter and sort projects with advanced filters
  const filteredProjects = portfolioItems
    .filter(item => {
      // Skip items that are not properly initialized
      if (!item || typeof item !== 'object') return false;
      
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        (item.song_title && item.song_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (Array.isArray(item.singer) && item.singer.some(s => s && typeof s === 'string' && s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (item.genre && item.genre.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Genre filter
      const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(item.genre);
      if (!matchesGenre) return false;

      // Work type filter
      if (selectedWorkType !== 'all') {
        const hasWorkType = (() => {
          switch (selectedWorkType) {
            case 'production':
              return Array.isArray(item.producer) && item.producer.length > 0;
            case 'mixing':
              return Array.isArray(item.mixing_engineer) && item.mixing_engineer.length > 0;
            case 'mastering':
              return Array.isArray(item.mastering_engineer) && item.mastering_engineer.length > 0;
            case 'songwriting':
              return (Array.isArray(item.songwriter) && item.songwriter.length > 0) || 
                     (Array.isArray(item.composer) && item.composer.length > 0);
            default:
              return true;
          }
        })();
        
        if (!hasWorkType) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Priority sorting:
      // 1. Featured items first (is_featured = true)
      // 2. Then by priority_order (lower number = higher priority)
      // 3. Then by release date (newest first)
      
      // Check featured status
      const aFeatured = a.is_featured ? 1 : 0;
      const bFeatured = b.is_featured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      
      // Check priority order
      const aPriority = a.priority_order ?? 999999;
      const bPriority = b.priority_order ?? 999999;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Fallback to release date
      const aDate = a.release_date_aggregator ? new Date(a.release_date_aggregator).getTime() : 0;
      const bDate = b.release_date_aggregator ? new Date(b.release_date_aggregator).getTime() : 0;
      return bDate - aDate;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenres, selectedWorkType]);

  // Scroll to projects grid when page changes
  useEffect(() => {
    if (projectsGridRef.current && currentPage > 1) {
      const yOffset = -100; // Offset untuk memberi jarak dari top
      const element = projectsGridRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ 
        top: y, 
        behavior: 'smooth' 
      });
    }
  }, [currentPage]);

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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="relative py-12 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-4">
            {/* Top Row: Search and Add Button */}
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

              {/* Admin Buttons (Add Portfolio & Edit List) */}
              {isAdmin && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Portfolio
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditListItems([...portfolioItems]);
                      setIsEditListModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 whitespace-nowrap"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Edit List
                  </button>
                </div>
              )}
            </div>

            {/* Advanced Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Genre Multi-Select Dropdown */}
              <div ref={genreDropdownRef} className="relative">
                <button
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Genres
                  {selectedGenres.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                      {selectedGenres.length}
                    </span>
                  )}
                  <svg className={`w-4 h-4 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Genre Dropdown with Nested Sub-Genres */}
                {showGenreDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {availableGenres.length > 0 ? (
                        availableGenres.map(genre => {
                          const isExpanded = expandedGenre === genre;
                          const subGenres = genreSubGenres[genre] || [];
                          const hasSubGenres = subGenres.length > 0;
                          const isGenreSelected = selectedGenres.includes(genre);
                          const selectedSubGenresCount = subGenres.filter(sub => selectedGenres.includes(sub)).length;
                          
                          return (
                            <div key={genre} className="relative">
                              {/* Main Genre Item */}
                              <div 
                                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                                  isGenreSelected || selectedSubGenresCount > 0
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isGenreSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedGenres([...selectedGenres, genre]);
                                      } else {
                                        // Remove genre and all its sub-genres
                                        setSelectedGenres(selectedGenres.filter(g => g !== genre && !subGenres.includes(g)));
                                      }
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                  />
                                  <span className={`text-sm flex-1 ${
                                    isGenreSelected || selectedSubGenresCount > 0
                                      ? 'text-indigo-900 dark:text-indigo-100 font-medium' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {genre}
                                    {selectedSubGenresCount > 0 && !isGenreSelected && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                                        {selectedSubGenresCount}
                                      </span>
                                    )}
                                  </span>
                                </label>
                                
                                {/* Expand/Collapse Button for Sub-Genres */}
                                {hasSubGenres && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedGenre(isExpanded ? null : genre);
                                    }}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                    title={`${subGenres.length} sub-genres`}
                                  >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                              </div>

                              {/* Sub-Genres List */}
                              {isExpanded && hasSubGenres && (
                                <div className="ml-6 mt-1 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-2">
                                  {subGenres.map(subGenre => {
                                    const isSubSelected = selectedGenres.includes(subGenre);
                                    return (
                                      <label 
                                        key={subGenre}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
                                          isSubSelected 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSubSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              // Add sub-genre, remove main genre if selected
                                              setSelectedGenres([...selectedGenres.filter(g => g !== genre), subGenre]);
                                            } else {
                                              setSelectedGenres(selectedGenres.filter(g => g !== subGenre));
                                            }
                                          }}
                                          className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className={`${
                                          isSubSelected 
                                            ? 'text-indigo-900 dark:text-indigo-100 font-medium' 
                                            : 'text-slate-600 dark:text-slate-400'
                                        }`}>
                                          {subGenre}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                          No genres available
                        </div>
                      )}
                    </div>
                    {selectedGenres.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                        <button
                          onClick={() => {
                            setSelectedGenres([]);
                            setExpandedGenre(null);
                          }}
                          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          Clear All ({selectedGenres.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Work Type Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedWorkType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedWorkType === 'all'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setSelectedWorkType('production')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedWorkType === 'production'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Production
                </button>
                <button
                  onClick={() => setSelectedWorkType('mixing')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedWorkType === 'mixing'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Mixing
                </button>
                <button
                  onClick={() => setSelectedWorkType('mastering')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedWorkType === 'mastering'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Mastering
                </button>
                <button
                  onClick={() => setSelectedWorkType('songwriting')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedWorkType === 'songwriting'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Songwriting
                </button>
              </div>

              {/* Clear All Filters Button */}
              {(selectedGenres.length > 0 || selectedWorkType !== 'all' || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSelectedGenres([]);
                    setSelectedWorkType('all');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-600 dark:text-slate-400">View:</span>
                <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setViewMode('tiles')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'tiles'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Tiles View"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section ref={projectsGridRef} className="relative py-12">
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
                disabled={!isAdmin}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={searchQuery}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={stagger}
                    className={
                      viewMode === 'tiles'
                        ? "grid gap-8 md:gap-12 sm:grid-cols-2 lg:grid-cols-3"
                        : "flex flex-col gap-4"
                    }
                  >
                    {currentItems.map((item) => (
                      <PortfolioCard
                        key={item.id}
                        item={item}
                        userRole={userRole}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        viewMode={viewMode}
                    onEdit={() => {
                      setEditingItem(item);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={async (id) => {
                      try {
                        const response = await fetch(`/api/portfolio?id=${id}`, {
                          method: 'DELETE',
                        });
                        if (response.ok) {
                          setPortfolioItems(prev => prev.filter(p => p.id !== id));
                        } else {
                          alert('Failed to delete portfolio item');
                        }
                      } catch (error) {
                        console.error('Error deleting portfolio:', error);
                        alert('Error deleting portfolio item');
                      }
                    }}
                    onToggleFeatured={async (id, currentStatus) => {
                      try {
                        const response = await fetch(`/api/portfolio?id=${id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            is_featured: !currentStatus
                          }),
                        });
                        if (response.ok) {
                          setPortfolioItems(prev => 
                            prev.map(p => p.id === id ? { ...p, is_featured: !currentStatus } : p)
                          );
                        } else {
                          alert('Failed to update featured status');
                        }
                      } catch (error) {
                        console.error('Error updating featured status:', error);
                        alert('Error updating featured status');
                      }
                    }}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </SortableContext>
        </DndContext>
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
                { 
                  label: "Artists", 
                  value: new Set(portfolioItems.flatMap(p => Array.isArray(p.singer) ? p.singer : [])).size.toString(), 
                  icon: Users 
                },
                { 
                  label: "Genres", 
                  value: new Set(portfolioItems.map(p => p.genre).filter(Boolean)).size.toString(), 
                  icon: Headphones 
                },
                { label: "Released", value: portfolioItems.filter(p => p.release_date_aggregator).length.toString(), icon: Award }
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

      {/* Edit Portfolio Modal */}
      {isEditModalOpen && editingItem && (
        <EditPortfolioModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={fetchPortfolioData}
          item={editingItem}
        />
      )}

      {/* Edit List Modal - Full List Reordering */}
      {isEditListModalOpen && (
        <EditListModal
          isOpen={isEditListModalOpen}
          onClose={() => setIsEditListModalOpen(false)}
          items={editListItems}
          onDragEnd={handleEditListDragEnd}
          onSave={saveEditListChanges}
          onUpdateItems={setEditListItems}
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
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [genreSubGenres, setGenreSubGenres] = useState<Record<string, string[]>>({});
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
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
    release_date_aggregator: '',
    spotify_link: '',
    youtube_link: '',
    apple_music_link: '',
    artwork_link: '',
    priority_order: ''
  });

  // Fetch music genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/music-genres');
        if (response.ok) {
          const result = await response.json();
          setMusicGenres(result.data || []);
          setGenreSubGenres(result.genreMap || {});
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    };

    if (showGenreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGenreDropdown]);

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
        release_date_aggregator: formData.release_date_aggregator || null,
        spotify_link: formData.spotify_link || null,
        youtube_link: formData.youtube_link || null,
        apple_music_link: formData.apple_music_link || null,
        artwork_link: formData.artwork_link || null,
        priority_order: formData.priority_order ? parseInt(formData.priority_order) : null
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
              <div ref={genreDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left flex items-center justify-between"
                >
                  <span className={formData.genre ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
                    {formData.genre || 'Select genre...'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Genre Dropdown with Nested Sub-Genres */}
                {showGenreDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {musicGenres.length > 0 ? (
                        musicGenres.map(genre => {
                          const isExpanded = expandedGenre === genre;
                          const subGenres = genreSubGenres[genre] || [];
                          const hasSubGenres = subGenres.length > 0;
                          const isSelected = formData.genre === genre;
                          
                          return (
                            <div key={genre} className="relative">
                              {/* Main Genre Item */}
                              <div 
                                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, genre }));
                                    setShowGenreDropdown(false);
                                    setExpandedGenre(null);
                                  }}
                                  className="flex items-center gap-2 flex-1 text-left"
                                >
                                  <span className={`text-sm flex-1 ${
                                    isSelected
                                      ? 'text-indigo-900 dark:text-indigo-100 font-medium' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {genre}
                                  </span>
                                </button>
                                
                                {/* Expand/Collapse Button for Sub-Genres */}
                                {hasSubGenres && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedGenre(isExpanded ? null : genre);
                                    }}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                    title={`${subGenres.length} sub-genres`}
                                  >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                              </div>

                              {/* Sub-Genres List */}
                              {isExpanded && hasSubGenres && (
                                <div className="ml-6 mt-1 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-2">
                                  {subGenres.map(subGenre => {
                                    const isSubSelected = formData.genre === subGenre;
                                    return (
                                      <button
                                        key={subGenre}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, genre: subGenre }));
                                          setShowGenreDropdown(false);
                                          setExpandedGenre(null);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs text-left ${
                                          isSubSelected 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 font-medium' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                      >
                                        {subGenre}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                          No genres available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {musicGenres.length} genres available with sub-genres
              </p>
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
                name="release_date_aggregator"
                value={formData.release_date_aggregator}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Priority Order */}
            <div>
              <label className="block text-sm font-medium mb-2">Priority Order</label>
              <input
                type="number"
                name="priority_order"
                value={formData.priority_order}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 1, 2, 3 (lower = higher priority)"
                min="1"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lower number = appears first (1, 2, 3...)
              </p>
            </div>
          </div>

          {/* Multi-value fields (comma-separated) */}
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For multiple values, separate with commas (e.g., &ldquo;John Doe, Jane Smith&rdquo;)
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
          </div>

          {/* Links & Artwork */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Links & Artwork
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide streaming links and artwork URL. <strong>Priority: Spotify artwork &gt; Apple Music &gt; YouTube auto-thumbnail</strong>
            </p>

            {/* Artwork Link */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <label className="block text-sm font-semibold mb-2 text-green-800 dark:text-green-300">
                🎨 Artwork URL <span className="text-xs font-normal">(Recommended: Spotify)</span>
              </label>
              <input
                type="url"
                name="artwork_link"
                value={formData.artwork_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://i.scdn.co/image/... (right-click Spotify album art → Copy Image Address)"
              />
              <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                💡 <strong>How to get Spotify artwork:</strong> Open song in Spotify → Right-click album art → &quot;Copy Image Address&quot;
              </p>
            </div>

            {/* Spotify Link */}
            <div>
              <label className="block text-sm font-medium mb-2">Spotify Link</label>
              <input
                type="url"
                name="spotify_link"
                value={formData.spotify_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://open.spotify.com/track/..."
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

            {/* Apple Music Link */}
            <div>
              <label className="block text-sm font-medium mb-2">Apple Music Link</label>
              <input
                type="url"
                name="apple_music_link"
                value={formData.apple_music_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://music.apple.com/..."
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

// Edit Portfolio Modal Component
function EditPortfolioModal({ 
  isOpen, 
  onClose,
  onSuccess,
  item
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: PortfolioItem;
}): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [genreSubGenres, setGenreSubGenres] = useState<Record<string, string[]>>({});
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    genre: item.genre || '',
    song_title: item.song_title || '',
    album_title: item.album_title || '',
    singer: Array.isArray(item.singer) ? item.singer.join(', ') : '',
    songwriter: Array.isArray(item.songwriter) ? item.songwriter.join(', ') : '',
    composer: Array.isArray(item.composer) ? item.composer.join(', ') : '',
    arranger: Array.isArray(item.arranger) ? item.arranger.join(', ') : '',
    producer: Array.isArray(item.producer) ? item.producer.join(', ') : '',
    mixing_engineer: Array.isArray(item.mixing_engineer) ? item.mixing_engineer.join(', ') : '',
    mastering_engineer: Array.isArray(item.mastering_engineer) ? item.mastering_engineer.join(', ') : '',
    publisher: Array.isArray(item.publisher) ? item.publisher.join(', ') : '',
    aggregator: Array.isArray(item.aggregator) ? item.aggregator.join(', ') : '',
    release_date_aggregator: item.release_date_aggregator || '',
    spotify_link: item.spotify_link || '',
    youtube_link: item.youtube_link || '',
    apple_music_link: item.apple_music_link || '',
    artwork_link: item.artwork_link || '',
    priority_order: item.priority_order?.toString() || ''
  });

  // Fetch music genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/music-genres');
        if (response.ok) {
          const result = await response.json();
          setMusicGenres(result.data || []);
          setGenreSubGenres(result.genreMap || {});
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false);
      }
    };

    if (showGenreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGenreDropdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        id: item.id,
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
        release_date_aggregator: formData.release_date_aggregator || null,
        spotify_link: formData.spotify_link || null,
        youtube_link: formData.youtube_link || null,
        apple_music_link: formData.apple_music_link || null,
        artwork_link: formData.artwork_link || null,
        priority_order: formData.priority_order ? parseInt(formData.priority_order) : null
      };

      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to update portfolio');
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      alert('Error updating portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Edit Portfolio
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Genre *</label>
              <div ref={genreDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left flex items-center justify-between"
                >
                  <span className={formData.genre ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
                    {formData.genre || 'Select genre...'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Genre Dropdown with Nested Sub-Genres */}
                {showGenreDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {musicGenres.length > 0 ? (
                        musicGenres.map(genre => {
                          const isExpanded = expandedGenre === genre;
                          const subGenres = genreSubGenres[genre] || [];
                          const hasSubGenres = subGenres.length > 0;
                          const isSelected = formData.genre === genre;
                          
                          return (
                            <div key={genre} className="relative">
                              {/* Main Genre Item */}
                              <div 
                                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, genre }));
                                    setShowGenreDropdown(false);
                                    setExpandedGenre(null);
                                  }}
                                  className="flex items-center gap-2 flex-1 text-left"
                                >
                                  <span className={`text-sm flex-1 ${
                                    isSelected
                                      ? 'text-indigo-900 dark:text-indigo-100 font-medium' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {genre}
                                  </span>
                                </button>
                                
                                {/* Expand/Collapse Button for Sub-Genres */}
                                {hasSubGenres && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedGenre(isExpanded ? null : genre);
                                    }}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                    title={`${subGenres.length} sub-genres`}
                                  >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                              </div>

                              {/* Sub-Genres List */}
                              {isExpanded && hasSubGenres && (
                                <div className="ml-6 mt-1 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-800 pl-2">
                                  {subGenres.map(subGenre => {
                                    const isSubSelected = formData.genre === subGenre;
                                    return (
                                      <button
                                        key={subGenre}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, genre: subGenre }));
                                          setShowGenreDropdown(false);
                                          setExpandedGenre(null);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs text-left ${
                                          isSubSelected 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 font-medium' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                      >
                                        {subGenre}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                          No genres available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {musicGenres.length} genres available with sub-genres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Song Title *</label>
              <input
                type="text"
                name="song_title"
                required
                value={formData.song_title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter song title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Album Title</label>
              <input
                type="text"
                name="album_title"
                value={formData.album_title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter album title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Release Date</label>
              <input
                type="date"
                name="release_date_aggregator"
                value={formData.release_date_aggregator}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Priority Order */}
            <div>
              <label className="block text-sm font-medium mb-2">Priority Order</label>
              <input
                type="number"
                name="priority_order"
                value={formData.priority_order}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 1, 2, 3 (lower = higher priority)"
                min="1"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lower number = appears first (1, 2, 3...)
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Credits (separate multiple names with commas)
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Singer(s)</label>
                <input
                  type="text"
                  name="singer"
                  value={formData.singer}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Singer 1, Singer 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Songwriter(s)</label>
                <input
                  type="text"
                  name="songwriter"
                  value={formData.songwriter}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Songwriter 1, Songwriter 2"
                />
              </div>

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
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Links & Artwork
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide streaming links and artwork URL. <strong>Priority: Spotify artwork &gt; Apple Music &gt; YouTube auto-thumbnail</strong>
            </p>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <label className="block text-sm font-semibold mb-2 text-green-800 dark:text-green-300">
                🎨 Artwork URL <span className="text-xs font-normal">(Recommended: Spotify)</span>
              </label>
              <input
                type="url"
                name="artwork_link"
                value={formData.artwork_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://i.scdn.co/image/... (right-click Spotify album art → Copy Image Address)"
              />
              <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                💡 <strong>How to get Spotify artwork:</strong> Open song in Spotify → Right-click album art → &quot;Copy Image Address&quot;
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Spotify Link</label>
              <input
                type="url"
                name="spotify_link"
                value={formData.spotify_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://open.spotify.com/track/..."
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium mb-2">Apple Music Link</label>
              <input
                type="url"
                name="apple_music_link"
                value={formData.apple_music_link}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://music.apple.com/..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Portfolio'}
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
  item,
  userRole,
  openMenuId,
  setOpenMenuId,
  viewMode,
  onEdit,
  onDelete,
  onToggleFeatured
}: { 
  item: PortfolioItem;
  userRole: UserRole;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  viewMode: 'tiles' | 'list';
  onEdit: () => void;
  onDelete: (id: number) => void;
  onToggleFeatured: (id: number, currentStatus: boolean) => void;
}): React.JSX.Element {
  const [imgSrc, setImgSrc] = React.useState<string>('');
  const [imgError, setImgError] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showMenu = openMenuId === item.id;
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, setOpenMenuId]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | null): string | null => {
    if (!url) return null;
    
    // Match patterns:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://youtube.com/watch?v=VIDEO_ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/,
      /youtube\.com\/embed\/([^&?\s]+)/,
      /youtube\.com\/v\/([^&?\s]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Extract Spotify track ID from URL (for potential future use)
  const getSpotifyTrackId = (url: string | null): string | null => {
    if (!url) return null;
    // https://open.spotify.com/track/TRACK_ID
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Extract Apple Music ID from URL (for potential future use)
  const getAppleMusicId = (url: string | null): string | null => {
    if (!url) return null;
    // https://music.apple.com/.../album-name/id123456789
    const match = url.match(/\/id(\d+)/);
    return match ? match[1] : null;
  };

  // Artwork/Thumbnail Priority System:
  // 1. artwork_link (Preferred: Spotify artwork URL)
  // 2. YouTube thumbnail (auto-extracted from youtube_link)
  // 3. Default FMG logo
  //
  // BEST PRACTICE: Put Spotify artwork URL in artwork_link field
  // Get Spotify artwork: Right-click album art → Copy Image Address
  // Format: https://i.scdn.co/image/[hash]
  React.useEffect(() => {
    let thumbnailUrl = "/img/logo/FMG-Universe-Flemmo-Music-Global.png";
    
    // Priority 1: Custom artwork_link
    // Recommended: Spotify artwork URL (best quality)
    // Format: https://i.scdn.co/image/...
    // Also accepts: Apple Music, YouTube, or any direct image URL
    if (item.artwork_link) {
      thumbnailUrl = item.artwork_link;
    }
    // Priority 2: YouTube thumbnail (auto-extracted)
    else if (item.youtube_link) {
      const videoId = getYouTubeVideoId(item.youtube_link);
      if (videoId) {
        // Try maxresdefault first (best quality)
        thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    // Priority 3: Default logo
    
    setImgSrc(thumbnailUrl);
  }, [item.artwork_link, item.youtube_link]);

  // Handle image error - fallback chain
  const handleImageError = () => {
    if (imgError) return; // Already tried fallback
    
    // If YouTube thumbnail failed, try lower quality
    if (item.youtube_link) {
      const videoId = getYouTubeVideoId(item.youtube_link);
      if (videoId && imgSrc.includes('maxresdefault')) {
        // Fallback to hqdefault (high quality default)
        setImgSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
        setImgError(true);
        return;
      }
    }
    
    // Final fallback to default logo
    setImgSrc("/img/logo/FMG-Universe-Flemmo-Music-Global.png");
    setImgError(true);
  };

  const hasCustomArtwork = item.artwork_link || (item.youtube_link && getYouTubeVideoId(item.youtube_link));

  // List View Layout
  if (viewMode === 'list') {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        variants={fadeUp}
        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
            <Image
              src={imgSrc}
              alt={item.song_title}
              fill
              loading="lazy"
              className={`object-cover ${!hasCustomArtwork ? 'opacity-40' : ''}`}
              sizes="128px"
              quality={75}
              onError={handleImageError}
            />
            
            {/* Genre Badge */}
            <div className="absolute bottom-2 left-2 right-2 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium px-2 py-1 rounded text-center truncate">
              {item.genre}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">
                  {item.song_title}
                </h3>
                {Array.isArray(item.singer) && item.singer.length > 0 && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm truncate">
                    {item.singer.join(', ')}
                  </p>
                )}
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <div ref={menuRef} className="flex items-center gap-2 flex-shrink-0">
                  {/* Drag Handle */}
                  <button
                    {...attributes}
                    {...listeners}
                    className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>

                  {/* Menu Button */}
                  <button
                    onClick={() => setOpenMenuId(showMenu ? null : item.id)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute top-12 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[140px] z-50">
                      <button
                        onClick={() => {
                          onEdit();
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onToggleFeatured(item.id, item.is_featured || false);
                          setOpenMenuId(null);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2 ${
                          item.is_featured 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${item.is_featured ? 'fill-amber-500' : ''}`} />
                        {item.is_featured ? 'Unfeatured' : 'Featured'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.song_title}"?`)) {
                            onDelete(item.id);
                          }
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Featured Badge */}
              {item.is_featured && isAdmin && (
                <div className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span>FEATURED</span>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
              {item.release_date_aggregator && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(item.release_date_aggregator)}</span>
                </div>
              )}
              {Array.isArray(item.songwriter) && item.songwriter.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate">{item.songwriter.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Platform Buttons */}
            {(item.spotify_link || item.apple_music_link || item.youtube_link) && (
              <div className="flex flex-wrap gap-2">
                {item.spotify_link && (
                  <Link
                    href={item.spotify_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-white text-xs font-medium rounded-full transition-colors"
                  >
                    <Music className="w-3.5 h-3.5" />
                    Spotify
                  </Link>
                )}
                {item.apple_music_link && (
                  <Link
                    href={item.apple_music_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FA233B] to-[#FB5C74] hover:from-[#FB2F45] hover:to-[#FC6D82] text-white text-xs font-medium rounded-full transition-all"
                  >
                    <Music className="w-3.5 h-3.5" />
                    Apple Music
                  </Link>
                )}
                {item.youtube_link && (
                  <Link
                    href={item.youtube_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] hover:bg-[#cc0000] text-white text-xs font-medium rounded-full transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    YouTube
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Tiles View Layout (Original)
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      variants={fadeUp}
      className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        
        <Image
          src={imgSrc}
          alt={item.song_title}
          fill
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJhMmEzMiIvPjwvc3ZnPg=="
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${!hasCustomArtwork ? 'opacity-40' : ''}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={75}
          onError={handleImageError}
        />

        {/* Featured Badge - Admin Only */}
        {item.is_featured && (userRole === 'admin' || userRole === 'owner') && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span>⭐</span>
            <span>FEATURED</span>
          </div>
        )}

        {/* Genre Badge */}
        <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          {item.genre}
        </div>

        {/* Admin Menu & Drag Handle */}
        {(userRole === 'admin' || userRole === 'owner') && (
          <div ref={menuRef} className="absolute top-4 left-4 z-40 flex items-center gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-lg cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setOpenMenuId(showMenu ? null : item.id)}
              className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-lg"
            >
              <MoreVertical className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
            
            {showMenu && (
              <div className="absolute top-10 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[140px] z-50">
                <button
                  onClick={() => {
                    onEdit();
                    setOpenMenuId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggleFeatured(item.id, item.is_featured || false);
                    setOpenMenuId(null);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2 ${
                    item.is_featured 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Star className={`w-4 h-4 ${item.is_featured ? 'fill-amber-500' : ''}`} />
                  {item.is_featured ? 'Unfeatured' : 'Featured'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${item.song_title}"?`)) {
                      onDelete(item.id);
                    }
                    setOpenMenuId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Overlay Content */}
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.song_title}</h3>
          {Array.isArray(item.singer) && item.singer.length > 0 && (
            <p className="text-white/80 text-sm line-clamp-1">{item.singer.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Release Date & Songwriter */}
        <div className="space-y-2">
          {item.release_date_aggregator && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(item.release_date_aggregator)}</span>
            </div>
          )}
          {Array.isArray(item.songwriter) && item.songwriter.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">Songwriter: {item.songwriter.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Credits Section */}
        <div className="space-y-2 text-xs">
          {Array.isArray(item.composer) && item.composer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Composer: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.composer.join(', ')}</span>
            </div>
          )}
          {Array.isArray(item.producer) && item.producer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Producer: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.producer.join(', ')}</span>
            </div>
          )}
          {Array.isArray(item.mixing_engineer) && item.mixing_engineer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Mixing: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.mixing_engineer.join(', ')}</span>
            </div>
          )}
          {Array.isArray(item.mastering_engineer) && item.mastering_engineer.length > 0 && (
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Mastering: </span>
              <span className="text-slate-600 dark:text-slate-400">{item.mastering_engineer.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Publisher Tags */}
        {Array.isArray(item.publisher) && item.publisher.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {item.publisher.map((pub, index) => (
              <span
                key={`pub-${index}`}
                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
              >
                {pub}
              </span>
            ))}
          </div>
        )}

        {/* Platform Links - Circular Buttons */}
        {(item.spotify_link || item.apple_music_link || item.youtube_link) && (
          <div className="pt-4 space-y-3">
            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

            {/* Platform Buttons */}
            <div className="flex items-center justify-center gap-3">
            {/* Spotify */}
            {item.spotify_link && (
              <Link
                href={item.spotify_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full transition-all hover:scale-110 shadow-lg"
                title="Listen on Spotify"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </Link>
            )}

            {/* Apple Music */}
            {item.apple_music_link && (
              <Link
                href={item.apple_music_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#FA243C] to-[#FA5C7C] hover:from-[#ff2d47] hover:to-[#ff6d8c] text-white rounded-full transition-all hover:scale-110 shadow-lg"
                title="Listen on Apple Music"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.595-.706 10.5 10.5 0 0 0-2.161-.2c-1.343-.015-2.686-.01-4.028-.004-.37 0-.74-.001-1.11.003-.54.006-1.08.003-1.62.004a5.77 5.77 0 0 0-2.16.245c-1.31.317-2.31 1.062-3.043 2.18a5.022 5.022 0 0 0-.706 1.595 10.5 10.5 0 0 0-.2 2.161c-.015 1.343-.01 2.686-.004 4.028 0 .37-.001.74.003 1.11.006.54.003 1.08.004 1.62.003.72.065 1.448.245 2.16.317 1.31 1.062 2.31 2.18 3.043a5.022 5.022 0 0 0 1.595.706c.673.138 1.362.193 2.052.199l4.028.004c.37 0 .74.001 1.11-.003.54-.006 1.08-.003 1.62-.004.72-.003 1.448-.065 2.16-.245 1.31-.317 2.31-1.062 3.043-2.18.426-.518.627-1.1.706-1.595.138-.673.193-1.362.199-2.052.015-1.343.01-2.686.004-4.028 0-.37.001-.74-.003-1.11-.006-.54-.003-1.08-.004-1.62zM8.23 17.187c-.248.227-.532.395-.86.5-.96.306-2.047.08-2.734-.572-.67-.637-.903-1.517-.59-2.416.206-.592.592-1.022 1.15-1.315.24-.126.498-.213.767-.268.574-.117 1.144-.095 1.695.127.472.19.86.49 1.15.903.433.616.522 1.31.288 2.014-.15.45-.43.828-.866 1.027zm7.79-5.83c-.002.387-.008.774-.005 1.16.004.387-.002.774-.002 1.16-.002 1.603-.007 3.205-.01 4.808-.002.66-.01 1.32-.02 1.98-.007.548-.02 1.096-.048 1.644-.03.58-.078 1.158-.21 1.725-.227 1.008-.683 1.87-1.462 2.513-.73.603-1.587.932-2.54 1.028-.823.082-1.638.054-2.448-.12-.712-.153-1.364-.43-1.95-.87-.586-.44-1.014-.996-1.29-1.65-.25-.59-.36-1.206-.39-1.84-.03-.638-.01-1.276-.01-1.914 0-.102.004-.204.008-.306.007-.202.018-.404.05-.604.052-.324.142-.637.296-.93.31-.586.77-1.018 1.39-1.275.62-.256 1.27-.31 1.93-.21.66.1 1.26.33 1.82.68.562.35 1.05.78 1.48 1.27.43.49.79 1.02 1.08 1.6.29.58.5 1.19.64 1.82.14.63.21 1.27.23 1.92.02.65.01 1.3.01 1.95 0 .1-.01.2-.01.3-.01.2-.02.4-.05.6-.05.32-.14.64-.3.93-.31.59-.77 1.02-1.39 1.28-.62.26-1.27.31-1.93.21-.66-.1-1.26-.33-1.82-.68-.562-.35-1.05-.78-1.48-1.27-.43-.49-.79-1.02-1.08-1.6-.29-.58-.5-1.19-.64-1.82-.14-.63-.21-1.27-.23-1.92-.02-.65-.01-1.3-.01-1.95 0-.1.01-.2.01-.3.01-.2.02-.4.05-.6.05-.32.14-.64.3-.93.31-.59.77-1.02 1.39-1.28.62-.26 1.27-.31 1.93-.21.66.1 1.26.33 1.82.68.562.35 1.05.78 1.48 1.27.43.49.79 1.02 1.08 1.6.29.58.5 1.19.64 1.82.14.63.21 1.27.23 1.92.02.65.01 1.3.01 1.95z"/>
                </svg>
              </Link>
            )}

            {/* YouTube */}
            {item.youtube_link && (
              <Link
                href={item.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center bg-[#FF0000] hover:bg-[#ff1a1a] text-white rounded-full transition-all hover:scale-110 shadow-lg"
                title="Watch on YouTube"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Link>
            )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// Edit List Modal Component - Full Portfolio Reordering
function EditListModal({
  isOpen,
  onClose,
  items,
  onDragEnd,
  onSave,
  onUpdateItems,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: PortfolioItem[];
  onDragEnd: (event: DragEndEvent) => void;
  onSave: () => void;
  onUpdateItems: (items: PortfolioItem[]) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [localItems, setLocalItems] = useState(items);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Toggle item selection
  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Select all items
  const selectAll = () => {
    setSelectedItems(localItems.map(item => item.id));
  };

  // Deselect all items
  const deselectAll = () => {
    setSelectedItems([]);
  };

  // Custom drag end handler for multi-select
  const handleMultiSelectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Check if the dragged item is part of selected items
    if (selectedItems.includes(active.id as number) && selectedItems.length > 1) {
      // Multi-select drag: move all selected items as a group
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Get all selected items sorted by their current position
      const sortedSelectedIds = [...selectedItems].sort((a, b) => {
        const indexA = localItems.findIndex(item => item.id === a);
        const indexB = localItems.findIndex(item => item.id === b);
        return indexA - indexB;
      });

      // Get the items data
      const selectedItemsData = sortedSelectedIds.map(id => 
        localItems.find(item => item.id === id)!
      );
      
      // Remove all selected items from the list
      const remainingItems = localItems.filter(item => !selectedItems.includes(item.id));

      // Calculate where to insert the group
      // Find the target item in the remaining items
      const targetIndexInRemaining = remainingItems.findIndex(item => item.id === over.id);
      
      let insertIndex: number;
      if (targetIndexInRemaining === -1) {
        // Target was one of the selected items, don't move
        return;
      } else {
        // Determine if we're moving up or down
        const draggedCurrentIndex = localItems.findIndex(item => item.id === active.id);
        const targetCurrentIndex = localItems.findIndex(item => item.id === over.id);
        
        if (draggedCurrentIndex < targetCurrentIndex) {
          // Moving down: insert after target
          insertIndex = targetIndexInRemaining + 1;
        } else {
          // Moving up: insert before target
          insertIndex = targetIndexInRemaining;
        }
      }
      
      // Insert selected items at the new position
      const reorderedItems = [
        ...remainingItems.slice(0, insertIndex),
        ...selectedItemsData,
        ...remainingItems.slice(insertIndex)
      ];

      // ONLY update local state - don't sync with parent until Save is clicked
      setLocalItems(reorderedItems);
    } else {
      // Single item drag: update both local and parent state
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localItems, oldIndex, newIndex);
        setLocalItems(reordered);
        onDragEnd(event); // Also update parent for single item
      }
    }
  };

  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, sync localItems to parent's editListItems
      // Update the priority_order for all items
      const updatedItems = localItems.map((item, index) => ({
        ...item,
        priority_order: index + 1
      }));
      
      // Update parent state with reordered items
      onUpdateItems(updatedItems);
      
      // Then call the save function to persist to database
      await onSave();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold">Edit Portfolio Order</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {selectedItems.length > 0 
                  ? `${selectedItems.length} items selected`
                  : `Total: ${items.length} items • Drag to reorder or use multi-select`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Multi-Select Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={selectedItems.length === items.length ? deselectAll : selectAll}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {selectedItems.length === items.length ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Deselect All
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select All
                </>
              )}
            </button>

            {selectedItems.length > 0 && (
              <>
                <div className="w-px h-6 bg-white/20" />
                <span className="text-sm text-indigo-100 px-2">
                  Drag any selected item to move all {selectedItems.length} items together
                </span>
                <button
                  onClick={deselectAll}
                  className="ml-auto px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleMultiSelectDragEnd}
          >
            <SortableContext
              items={localItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {localItems.map((item, index) => (
                  <EditListItem
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={selectedItems.includes(item.id)}
                    onToggleSelect={() => toggleItemSelection(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Arrange items then click Save Changes
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Sortable List Item for Edit List Modal
function EditListItem({
  item,
  index,
  isSelected,
  onToggleSelect,
}: {
  item: PortfolioItem;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-4 p-4 rounded-xl hover:shadow-md transition-all ${
        isSelected 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500' 
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
      </div>

      {/* Order Number */}
      <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg font-bold ${
        isSelected 
          ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
      }`}>
        {index + 1}
      </div>

      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${
          isSelected 
            ? 'text-indigo-900 dark:text-indigo-100' 
            : 'text-slate-900 dark:text-white'
        }`}>
          {item.song_title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
          {Array.isArray(item.singer) && item.singer.length > 0 && (
            <span className="truncate">{item.singer.join(', ')}</span>
          )}
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            isSelected
              ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
              : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          }`}>
            {item.genre}
          </span>
        </div>
      </div>

      {/* Featured Badge */}
      {item.is_featured && (
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
          <Star className="w-3 h-3 fill-amber-500" />
          FEATURED
        </div>
      )}
    </div>
  );
}
