-- Users table (mirrors auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concerts table
CREATE TABLE public.concerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'attended')),
  spotify_url TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concert members (many-to-many)
CREATE TABLE public.concert_members (
  concert_id UUID REFERENCES public.concerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (concert_id, user_id)
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id UUID REFERENCES public.concerts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (concert_id, user_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id UUID REFERENCES public.concerts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setlist songs
CREATE TABLE public.setlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id UUID REFERENCES public.concerts(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  song_title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concert notes (shared notepad)
CREATE TABLE public.concert_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id UUID REFERENCES public.concerts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concert_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concert_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users
CREATE POLICY "Authenticated users can read all users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies: concerts
CREATE POLICY "Authenticated users can read concerts" ON public.concerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert concerts" ON public.concerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Concert creator can update" ON public.concerts FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Concert creator can delete" ON public.concerts FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS Policies: concert_members
CREATE POLICY "Authenticated users can read members" ON public.concert_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage members" ON public.concert_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete members" ON public.concert_members FOR DELETE TO authenticated USING (true);

-- RLS Policies: reviews
CREATE POLICY "Authenticated users can read reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own review" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own review" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies: chat_messages
CREATE POLICY "Authenticated users can read messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies: setlist_songs
CREATE POLICY "Authenticated users can read setlist" ON public.setlist_songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage setlist" ON public.setlist_songs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete setlist songs" ON public.setlist_songs FOR DELETE TO authenticated USING (true);

-- RLS Policies: concert_notes
CREATE POLICY "Authenticated users can read notes" ON public.concert_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notes" ON public.concert_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notes" ON public.concert_notes FOR UPDATE TO authenticated USING (true);
