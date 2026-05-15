-- Create movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INTEGER,
  genre TEXT,
  rating DECIMAL(2,1),
  poster_url TEXT,
  description TEXT,
  video_url TEXT,
  download_url TEXT,
  type TEXT DEFAULT 'movie', -- movie, series, anime
  is_featured BOOLEAN DEFAULT false,
  is_top_rated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to movies
CREATE POLICY "Allow public read access" ON public.movies FOR SELECT USING (true);

-- Insert sample movies
INSERT INTO public.movies (title, year, genre, rating, poster_url, type, is_featured, is_top_rated) VALUES
('Rapid Action', 2025, 'Action', 4.0, '/placeholder.svg?height=400&width=280', 'movie', true, false),
('Bait', 2025, 'Action', 3.5, '/placeholder.svg?height=400&width=280', 'movie', true, true),
('My Name 6', 2025, 'Action', 5.0, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('My Name 5', 2025, 'Action', 4.5, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('Goddess of Fire ep26', 2025, 'Drama', 4.0, '/placeholder.svg?height=400&width=280', 'series', false, false),
('Goddess of Fire ep25', 2025, 'Drama', 4.0, '/placeholder.svg?height=400&width=280', 'series', false, false),
('Shadow Warriors', 2025, 'Action', 3.5, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('Blood & Bone', 2025, 'Action', 4.5, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('Dragon Master', 2025, 'Action', 4.0, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('Night Hunt', 2025, 'Thriller', 4.0, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('The Warrior', 2025, 'Action', 4.5, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('Beast of War', 2025, 'Action', 4.0, '/placeholder.svg?height=400&width=280', 'movie', false, false),
('Frankenstein', 2025, 'Horror', 4.5, '/placeholder.svg?height=400&width=280', 'movie', false, true),
('Spectral', 2025, 'Horror', 4.0, '/placeholder.svg?height=400&width=280', 'movie', false, true);
