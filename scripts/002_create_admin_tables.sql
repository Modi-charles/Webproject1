-- Create series table with episodes
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  poster_url TEXT,
  rating DECIMAL(3,1) DEFAULT 7.5,
  year INTEGER DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create episodes table
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  stream_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create originals table
CREATE TABLE IF NOT EXISTS public.originals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  stream_url TEXT,
  rating DECIMAL(3,1) DEFAULT 7.5,
  year INTEGER DEFAULT 2026,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animations table
CREATE TABLE IF NOT EXISTS public.animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  stream_url TEXT,
  rating DECIMAL(3,1) DEFAULT 7.5,
  year INTEGER DEFAULT 2026,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create music_videos table
CREATE TABLE IF NOT EXISTS public.music_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  stream_url TEXT,
  rating DECIMAL(3,1) DEFAULT 7.5,
  year INTEGER DEFAULT 2026,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create carousel table
CREATE TABLE IF NOT EXISTS public.carousel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  banner_url TEXT NOT NULL,
  link_type TEXT DEFAULT 'none',
  link_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for admin management
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_trending column to movies if not exists
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS stream_url TEXT;
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS category TEXT;

-- Enable RLS on all tables
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.originals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read series" ON public.series FOR SELECT USING (true);
CREATE POLICY "Allow public read episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Allow public read originals" ON public.originals FOR SELECT USING (true);
CREATE POLICY "Allow public read animations" ON public.animations FOR SELECT USING (true);
CREATE POLICY "Allow public read music_videos" ON public.music_videos FOR SELECT USING (true);
CREATE POLICY "Allow public read carousel" ON public.carousel FOR SELECT USING (true);
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);

-- Allow insert/update/delete for all (in production, restrict to authenticated admins)
CREATE POLICY "Allow all insert series" ON public.series FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update series" ON public.series FOR UPDATE USING (true);
CREATE POLICY "Allow all delete series" ON public.series FOR DELETE USING (true);

CREATE POLICY "Allow all insert episodes" ON public.episodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update episodes" ON public.episodes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete episodes" ON public.episodes FOR DELETE USING (true);

CREATE POLICY "Allow all insert originals" ON public.originals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update originals" ON public.originals FOR UPDATE USING (true);
CREATE POLICY "Allow all delete originals" ON public.originals FOR DELETE USING (true);

CREATE POLICY "Allow all insert animations" ON public.animations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update animations" ON public.animations FOR UPDATE USING (true);
CREATE POLICY "Allow all delete animations" ON public.animations FOR DELETE USING (true);

CREATE POLICY "Allow all insert music_videos" ON public.music_videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update music_videos" ON public.music_videos FOR UPDATE USING (true);
CREATE POLICY "Allow all delete music_videos" ON public.music_videos FOR DELETE USING (true);

CREATE POLICY "Allow all insert carousel" ON public.carousel FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update carousel" ON public.carousel FOR UPDATE USING (true);
CREATE POLICY "Allow all delete carousel" ON public.carousel FOR DELETE USING (true);

CREATE POLICY "Allow all insert movies" ON public.movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update movies" ON public.movies FOR UPDATE USING (true);
CREATE POLICY "Allow all delete movies" ON public.movies FOR DELETE USING (true);
