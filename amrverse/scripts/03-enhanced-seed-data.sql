-- Enhanced Seed Data for AmrVerse
-- 15-20 diverse manhwas with realistic content and proper chapters

-- Clear existing demo data (optional - comment out if you want to keep old data)
-- DELETE FROM chapter_pages WHERE chapter_id IN (SELECT id FROM chapters WHERE manhwa_id IN (SELECT id FROM manhwas WHERE created_by = '00000000-0000-0000-0000-000000000001'));
-- DELETE FROM chapters WHERE manhwa_id IN (SELECT id FROM manhwas WHERE created_by = '00000000-0000-0000-0000-000000000001');
-- DELETE FROM manhwas WHERE created_by = '00000000-0000-0000-0000-000000000001';

-- Ensure demo creator exists
INSERT INTO users (id, email, username, password_hash, display_name, avatar_url, bio, is_creator)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@amrverse.com',
  'amrverse_demo',
  '$2a$10$demohashdemohashdemohashdemohashdemohashdemohashdemoha', -- placeholder hash
  'AmrVerse Demo Creator',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
  'Official AmrVerse demo content curator',
  true
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  is_creator = EXCLUDED.is_creator;

-- Insert 20 diverse manhwas across different genres
INSERT INTO manhwas (id, title, slug, description, cover_url, author, status, genre, rating, total_chapters, created_by)
VALUES
  -- Fantasy & Adventure
  (
    '10000000-0000-0000-0000-000000000001',
    'Eclipse Chronicles',
    'eclipse-chronicles',
    'When the sun turns black, humanity discovers magic was real all along. A young mage must prevent the eternal night from consuming the world.',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop',
    'Luna Park',
    'ongoing',
    ARRAY['fantasy', 'adventure', 'magic', 'action'],
    4.7,
    45,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Digital Dungeons',
    'digital-dungeons',
    'Trapped in a virtual reality RPG, players must clear 100 floors to escape. Death in-game means death in reality.',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=1200&fit=crop',
    'Kim Jae-won',
    'ongoing',
    ARRAY['action', 'sci-fi', 'game', 'thriller'],
    4.8,
    78,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Romance & Drama
  (
    '10000000-0000-0000-0000-000000000003',
    'Coffee & Constellations',
    'coffee-constellations',
    'A barista who can read fortunes in coffee foam meets an astronomer who stopped believing in fate.',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&h=1200&fit=crop',
    'Sarah Min',
    'ongoing',
    ARRAY['romance', 'slice-of-life', 'drama'],
    4.5,
    32,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Melody of Hearts',
    'melody-of-hearts',
    'Two rival musicians compete for a scholarship, only to discover their harmonies create something magical together.',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=1200&fit=crop',
    'Alex Chen',
    'completed',
    ARRAY['romance', 'music', 'school-life', 'drama'],
    4.9,
    56,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Horror & Thriller
  (
    '10000000-0000-0000-0000-000000000005',
    'The Forgotten Floor',
    'the-forgotten-floor',
    'A building with a floor that only appears at midnight. Those who enter rarely return the same.',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=1200&fit=crop',
    'Dark Ji-ho',
    'ongoing',
    ARRAY['horror', 'mystery', 'psychological', 'supernatural'],
    4.6,
    41,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Whispers in the Code',
    'whispers-in-code',
    'An AI starts leaving cryptic messages for a programmer. The countdown has begun, but to what?',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=1200&fit=crop',
    'Tech Reaper',
    'ongoing',
    ARRAY['thriller', 'sci-fi', 'mystery', 'technology'],
    4.4,
    29,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Action & Martial Arts
  (
    '10000000-0000-0000-0000-000000000007',
    'Iron Fist Academy',
    'iron-fist-academy',
    'The world''s deadliest fighters compete in a secret underground school where failure means death.',
    'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=1200&fit=crop',
    'Thunder Lee',
    'ongoing',
    ARRAY['action', 'martial-arts', 'school-life', 'tournament'],
    4.7,
    92,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'Street Kings',
    'street-kings',
    'Urban parkour meets martial arts as street gangs battle for territory in a dystopian megacity.',
    'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=800&h=1200&fit=crop',
    'Urban Warrior',
    'completed',
    ARRAY['action', 'urban', 'gang', 'parkour'],
    4.5,
    68,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Comedy & Slice of Life
  (
    '10000000-0000-0000-0000-000000000009',
    'My Roommate is a Demon Lord',
    'roommate-demon-lord',
    'A college student accidentally summons a demon lord who just wants to experience modern life and eat ramen.',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=1200&fit=crop',
    'Funny Bones',
    'ongoing',
    ARRAY['comedy', 'supernatural', 'slice-of-life', 'fantasy'],
    4.8,
    53,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    'Part-Time Hero',
    'part-time-hero',
    'Being a superhero doesn''t pay the bills. Follow our hero juggling three part-time jobs and saving the world.',
    'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&h=1200&fit=crop',
    'Cape & Coffee',
    'ongoing',
    ARRAY['comedy', 'superhero', 'slice-of-life', 'action'],
    4.6,
    38,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Sci-Fi & Futuristic
  (
    '10000000-0000-0000-0000-000000000011',
    'Neon Samurai',
    'neon-samurai',
    'In cyber-Tokyo 2157, a hacker discovers ancient samurai code that gives him superhuman abilities.',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=1200&fit=crop',
    'Cyber Akira',
    'ongoing',
    ARRAY['sci-fi', 'cyberpunk', 'action', 'technology'],
    4.9,
    61,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000012',
    'Last Colony',
    'last-colony',
    'Humanity''s final outpost on Mars fights for survival as Earth goes silent.',
    'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=1200&fit=crop',
    'Space Nova',
    'completed',
    ARRAY['sci-fi', 'space', 'survival', 'drama'],
    4.7,
    44,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Mystery & Detective
  (
    '10000000-0000-0000-0000-000000000013',
    'The Timekeeper''s Case',
    'timekeepers-case',
    'A detective who can see 5 seconds into the past must solve murders before they happen.',
    'https://images.unsplash.com/photo-1527269534026-c86f4009eace?w=800&h=1200&fit=crop',
    'Mystery Clock',
    'ongoing',
    ARRAY['mystery', 'detective', 'supernatural', 'thriller'],
    4.8,
    47,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000014',
    'Shadow Archives',
    'shadow-archives',
    'An archivist discovers forbidden books that reveal the truth about their world''s dark past.',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=1200&fit=crop',
    'Archive Keeper',
    'ongoing',
    ARRAY['mystery', 'fantasy', 'adventure', 'library'],
    4.5,
    35,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Historical & Period
  (
    '10000000-0000-0000-0000-000000000015',
    'Silk Road Legends',
    'silk-road-legends',
    'Follow merchants, warriors, and mystics along the ancient Silk Road in this historical epic.',
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=1200&fit=crop',
    'History Weaver',
    'ongoing',
    ARRAY['historical', 'adventure', 'drama', 'culture'],
    4.6,
    28,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000016',
    'Shogun''s Shadow',
    'shoguns-shadow',
    'A ninja serves in secret as the Shogun''s hidden blade, but loyalty is tested when truth emerges.',
    'https://images.unsplash.com/photo-1543373014-cfe4f4bc1cdf?w=800&h=1200&fit=crop',
    'Edo Master',
    'completed',
    ARRAY['historical', 'action', 'ninja', 'japan'],
    4.9,
    72,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Sports & Competition
  (
    '10000000-0000-0000-0000-000000000017',
    'Apex Racers',
    'apex-racers',
    'Underground street racing meets cutting-edge technology in this high-octane series.',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=1200&fit=crop',
    'Speed Demon',
    'ongoing',
    ARRAY['sports', 'racing', 'action', 'competition'],
    4.7,
    51,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000018',
    'King of the Court',
    'king-of-court',
    'A basketball prodigy returns from injury to reclaim his throne and lead his team to nationals.',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=1200&fit=crop',
    'Hoop Dreams',
    'ongoing',
    ARRAY['sports', 'basketball', 'school-life', 'competition'],
    4.8,
    64,
    '00000000-0000-0000-0000-000000000001'
  ),
  
  -- Supernatural & Paranormal
  (
    '10000000-0000-0000-0000-000000000019',
    'Spirit Bound',
    'spirit-bound',
    'A medium helps restless spirits find peace, but one spirit refuses to leave her side.',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop',
    'Ghost Whisperer',
    'ongoing',
    ARRAY['supernatural', 'romance', 'mystery', 'paranormal'],
    4.6,
    39,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000020',
    'Moon Hunters',
    'moon-hunters',
    'When werewolves emerge in modern Seoul, a secret hunter organization must protect the city.',
    'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800&h=1200&fit=crop',
    'Lunar Pack',
    'ongoing',
    ARRAY['supernatural', 'action', 'urban-fantasy', 'werewolf'],
    4.7,
    55,
    '00000000-0000-0000-0000-000000000001'
  );

-- Update total_chapters count
UPDATE manhwas SET total_chapters = 3 WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005'
);
