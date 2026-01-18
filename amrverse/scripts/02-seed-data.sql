-- Seed data for AmrVerse
-- Insert sample manhwas, chapters, and pages

-- Insert sample user (for created_by field)
INSERT INTO users (id, email, username, password_hash, display_name, is_creator)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'creator@amrverse.com',
  'admin_creator',
  'placeholder_hash',
  'AmrVerse Creator',
  true
)
ON CONFLICT DO NOTHING;

-- Insert sample manhwas
INSERT INTO manhwas (id, title, slug, description, cover_url, author, status, genre, created_by)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Tower of God',
    'tower-of-god',
    'A young man named Bam enters a mysterious tower to find his friend who disappeared inside. As he climbs higher, he discovers a vast world with countless mysteries.',
    '/placeholder.jpg',
    'SIU',
    'ongoing',
    ARRAY['action', 'adventure', 'fantasy', 'mystery'],
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'The God of High School',
    'the-god-of-high-school',
    'A high school tournament with martial arts and supernatural powers. A group of high school students compete in the national tournament with extraordinary abilities.',
    '/placeholder.jpg',
    'Park Yongje',
    'completed',
    ARRAY['action', 'martial arts', 'supernatural'],
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Solo Leveling',
    'solo-leveling',
    'A hunter named Sung Jinwoo mysteriously gains the ability to level up indefinitely. As the weakest hunter in the world, he begins his journey to become the strongest.',
    '/placeholder.jpg',
    'Chugong',
    'ongoing',
    ARRAY['action', 'fantasy', 'supernatural', 'adventure'],
    '00000000-0000-0000-0000-000000000001'
  );

-- Insert sample chapters for Tower of God
INSERT INTO chapters (id, manhwa_id, chapter_number, title, pages_count)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    1,
    'Entrance',
    35
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    2,
    'The Test Begins',
    38
  );

-- Insert sample pages for Chapter 1
INSERT INTO chapter_pages (id, chapter_id, page_number, image_url, image_height)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    1,
    '/placeholder.svg?height=800&width=600',
    800
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    2,
    '/placeholder.svg?height=800&width=600',
    800
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    3,
    '/placeholder.svg?height=800&width=600',
    800
  );

-- Insert sample pages for Chapter 2
INSERT INTO chapter_pages (id, chapter_id, page_number, image_url, image_height)
VALUES
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    1,
    '/placeholder.svg?height=800&width=600',
    800
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    2,
    '/placeholder.svg?height=800&width=600',
    800
  );

-- Insert sample chapters and pages for other manhwas
INSERT INTO chapters (id, manhwa_id, chapter_number, title, pages_count)
VALUES
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    1,
    'Tournament Begins',
    40
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    1,
    'Awakening',
    35
  );
