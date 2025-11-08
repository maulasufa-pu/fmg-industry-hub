import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all unique genres from music_genres table
export async function GET() {
  try {
    // Get all unique genres sorted alphabetically
    const { data, error } = await supabase
      .from('music_genres')
      .select('genre')
      .order('genre', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch genres', details: error.message },
        { status: 500 }
      );
    }

    // Get unique genres
    const uniqueGenres = Array.from(new Set(data.map(item => item.genre)));

    return NextResponse.json({
      success: true,
      data: uniqueGenres,
      count: uniqueGenres.length
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET sub-genres for a specific genre
export async function POST(request: Request) {
  try {
    const { genre } = await request.json();

    if (!genre) {
      return NextResponse.json(
        { error: 'Genre parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('music_genres')
      .select('sub_genre')
      .eq('genre', genre)
      .order('sub_genre', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sub-genres', details: error.message },
        { status: 500 }
      );
    }

    const subGenres = data.map(item => item.sub_genre);

    return NextResponse.json({
      success: true,
      genre: genre,
      data: subGenres,
      count: subGenres.length
    });
  } catch (error) {
    console.error('Error fetching sub-genres:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
