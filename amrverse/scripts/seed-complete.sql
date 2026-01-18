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
-- Seed Chapters and Pages for Demo Manhwas
-- Creating 3 chapters per manhwa with realistic page counts

-- Eclipse Chronicles - Chapters
INSERT INTO chapters (id, manhwa_id, chapter_number, title, description, pages_count, published_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    1,
    'The Day the Sun Died',
    'The world changes forever as the eclipse begins and magic awakens.',
    18,
    NOW() - INTERVAL '30 days'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    2,
    'First Flame',
    'Luna discovers her hidden magical powers.',
    20,
    NOW() - INTERVAL '23 days'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    3,
    'The Academy Awaits',
    'An invitation arrives from the mysterious Twilight Academy.',
    22,
    NOW() - INTERVAL '16 days'
  );

-- Digital Dungeons - Chapters
INSERT INTO chapters (id, manhwa_id, chapter_number, title, description, pages_count, published_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    1,
    'Logged In Forever',
    'Players realize they cannot log out of the game.',
    25,
    NOW() - INTERVAL '28 days'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    2,
    'Floor 1 - The Tutorial',
    'The first dungeon becomes a deadly trial.',
    24,
    NOW() - INTERVAL '21 days'
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000002',
    3,
    'Party Formation',
    'Strangers must work together to survive.',
    26,
    NOW() - INTERVAL '14 days'
  );

-- Coffee & Constellations - Chapters
INSERT INTO chapters (id, manhwa_id, chapter_number, title, description, pages_count, published_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000003',
    1,
    'Foam and Fortune',
    'The first meeting at Starlight Cafe.',
    15,
    NOW() - INTERVAL '25 days'
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000003',
    2,
    'Written in the Stars',
    'An unexpected reading changes everything.',
    16,
    NOW() - INTERVAL '18 days'
  ),
  (
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000003',
    3,
    'Cosmic Connection',
    'Two worldviews collide and hearts begin to open.',
    17,
    NOW() - INTERVAL '11 days'
  );

-- Melody of Hearts - Chapters
INSERT INTO chapters (id, manhwa_id, chapter_number, title, description, pages_count, published_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000004',
    1,
    'Rival Melodies',
    'The scholarship competition begins.',
    19,
    NOW() - INTERVAL '27 days'
  ),
  (
    '20000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000004',
    2,
    'Accidental Duet',
    'A practice room mix-up leads to an unexpected harmony.',
    21,
    NOW() - INTERVAL '20 days'
  ),
  (
    '20000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000004',
    3,
    'Crescendo',
    'Musical magic brings them closer together.',
    20,
    NOW() - INTERVAL '13 days'
  );

-- The Forgotten Floor - Chapters
INSERT INTO chapters (id, manhwa_id, chapter_number, title, description, pages_count, published_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000005',
    1,
    'The 13th Floor',
    'Urban legends speak of a floor that shouldn''t exist.',
    23,
    NOW() - INTERVAL '26 days'
  ),
  (
    '20000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000005',
    2,
    'Midnight Descent',
    'The elevator opens to an impossible world.',
    24,
    NOW() - INTERVAL '19 days'
  ),
  (
    '20000000-0000-0000-0000-000000000015',
    '10000000-0000-0000-0000-000000000005',
    3,
    'What Was Lost',
    'The truth about the forgotten floor begins to surface.',
    25,
    NOW() - INTERVAL '12 days'
  );
-- Seed Chapter Pages with Unsplash images
-- Part 1: Eclipse Chronicles (3 chapters)

-- Chapter 1: The Day the Sun Died (18 pages)
INSERT INTO chapter_pages (chapter_id, page_number, image_url, image_height) VALUES
  ('20000000-0000-0000-0000-000000000001', 1, 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 2, 'https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 3, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 4, 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 5, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 6, 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 7, 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 8, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 9, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 10, 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 11, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 12, 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 13, 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 14, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 15, 'https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 16, 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 17, 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000001', 18, 'https://images.unsplash.com/photo-1502943693086-33b5b1cfdf2f?w=800&h=1200&fit=crop', 1200);

-- Chapter 2: First Flame (20 pages)
INSERT INTO chapter_pages (chapter_id, page_number, image_url, image_height) VALUES
  ('20000000-0000-0000-0000-000000000002', 1, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 2, 'https://images.unsplash.com/photo-1483086431886-3590a88317fe?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 3, 'https://images.unsplash.com/photo-1529904347868-ba0fcfedf01c?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 4, 'https://images.unsplash.com/photo-1495615080073-6b89c9839ce0?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 5, 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 6, 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 7, 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 8, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 9, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 10, 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 11, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 12, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 13, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 14, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 15, 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 16, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 17, 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 18, 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 19, 'https://images.unsplash.com/photo-1445905595283-21f8ae8a33d2?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000002', 20, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=1200&fit=crop', 1200);

-- Chapter 3: The Academy Awaits (22 pages)
INSERT INTO chapter_pages (chapter_id, page_number, image_url, image_height) VALUES
  ('20000000-0000-0000-0000-000000000003', 1, 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 2, 'https://images.unsplash.com/photo-1495954484750-af469f2f9be5?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 3, 'https://images.unsplash.com/photo-1523459178261-028135da2714?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 4, 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 6, 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 7, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 8, 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 9, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 10, 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 11, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 12, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 13, 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 14, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 15, 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 16, 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 17, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 18, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 19, 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 20, 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 21, 'https://images.unsplash.com/photo-1517093728432-153547178a0e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000003', 22, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop', 1200);

-- Digital Dungeons - Chapter 1: Logged In Forever (25 pages)
INSERT INTO chapter_pages (chapter_id, page_number, image_url, image_height) VALUES
  ('20000000-0000-0000-0000-000000000004', 1, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 2, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 3, 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 4, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 5, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 6, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 7, 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 8, 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 9, 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 10, 'https://images.unsplash.com/photo-1606136295962-8eceb7ff7c85?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 11, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 12, 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 13, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 14, 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 15, 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 16, 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 17, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 18, 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 19, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 20, 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 21, 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 22, 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 23, 'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 24, 'https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000004', 25, 'https://images.unsplash.com/photo-1640622842223-e1e39f4bf83a?w=800&h=1200&fit=crop', 1200);

-- Digital Dungeons - Chapter 2: Floor 1 - The Tutorial (24 pages)
INSERT INTO chapter_pages (chapter_id, page_number, image_url, image_height) VALUES
  ('20000000-0000-0000-0000-000000000005', 1, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 2, 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 3, 'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 4, 'https://images.unsplash.com/photo-1640622842864-481f0c07d78c?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 5, 'https://images.unsplash.com/photo-1640622300473-977435c38c04?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 6, 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 7, 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 8, 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 9, 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 10, 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 11, 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 12, 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 13, 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 14, 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 15, 'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 16, 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 17, 'https://images.unsplash.com/photo-1614854262340-ab1ca7d079c7?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 18, 'https://images.unsplash.com/photo-1640622842223-e1e39f4bf83a?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 19, 'https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 20, 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 21, 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 22, 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 23, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop', 1200),
  ('20000000-0000-0000-0000-000000000005', 24, 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&h=1200&fit=crop', 1200);
