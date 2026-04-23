-- ============================================
-- DA Bubble — Supabase Database Schema
-- ============================================
-- Dieses Script im Supabase Dashboard unter
-- SQL Editor ausfuehren.
-- ============================================

-- 1. Users (verknuepft mit Supabase Auth)
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  status          BOOLEAN DEFAULT false,
  user_image      TEXT DEFAULT 'assets/img/profile.png',
  last_reactions  TEXT[] DEFAULT ARRAY['👍','😊'],
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Channels
CREATE TABLE public.channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  created_by_user UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Channel Members (Join-Tabelle)
CREATE TABLE public.channel_members (
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- 4. Messages
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT NOT NULL DEFAULT '',
  sender_id  UUID REFERENCES public.users(id),
  user_id    UUID REFERENCES public.users(id),
  thread_id  UUID REFERENCES public.messages(id),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Reactions (normalisiert)
CREATE TABLE public.reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_name  TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- ============================================
-- Indexes fuer haeufige Queries
-- ============================================

CREATE INDEX idx_channel_members_user    ON public.channel_members(user_id);
CREATE INDEX idx_channel_members_channel ON public.channel_members(channel_id);
CREATE INDEX idx_messages_channel        ON public.messages(channel_id, created_at);
CREATE INDEX idx_messages_thread         ON public.messages(thread_id, created_at);
CREATE INDEX idx_messages_private        ON public.messages(sender_id, user_id, created_at);
CREATE INDEX idx_messages_sender         ON public.messages(sender_id);
CREATE INDEX idx_reactions_message       ON public.reactions(message_id);

-- ============================================
-- Realtime aktivieren
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Users: Alle authentifizierten User duerfen lesen, eigenes Profil bearbeiten
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_delete" ON public.users
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- Channels: Alle authentifizierten User duerfen lesen, Ersteller darf bearbeiten/loeschen
CREATE POLICY "channels_select" ON public.channels
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "channels_insert" ON public.channels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by_user);
CREATE POLICY "channels_update" ON public.channels
  FOR UPDATE TO authenticated USING (auth.uid() = created_by_user);
CREATE POLICY "channels_delete" ON public.channels
  FOR DELETE TO authenticated USING (auth.uid() = created_by_user);

-- Channel Members: Lesen fuer alle, Einfuegen/Loeschen fuer Mitglieder
CREATE POLICY "channel_members_select" ON public.channel_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "channel_members_insert" ON public.channel_members
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "channel_members_delete" ON public.channel_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages: Lesen fuer alle, eigene erstellen/bearbeiten/loeschen
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Reactions: Lesen fuer alle, eigene erstellen/loeschen
CREATE POLICY "reactions_select" ON public.reactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON public.reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- Trigger: User-Profil automatisch bei Signup anlegen
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, user_image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Neuer User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_image', 'assets/img/profile.png')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RPC: Anonymen Guest-User loeschen (CASCADE loescht alle Daten)
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_anonymous_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users
  WHERE id = auth.uid()
    AND is_anonymous = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Default-Channel erstellen
-- ============================================

INSERT INTO public.channels (name, description)
VALUES ('Allgemein', 'Allgemeiner Kanal fuer alle Mitglieder')
ON CONFLICT (name) DO NOTHING;
