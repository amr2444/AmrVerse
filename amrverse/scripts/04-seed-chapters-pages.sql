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
