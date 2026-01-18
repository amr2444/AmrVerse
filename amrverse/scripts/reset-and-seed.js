const { Pool } = require('pg');
const fs = require('fs');

async function resetAndSeed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:amrverse123@localhost:5432/amrverse'
  });

  try {
    console.log('🔌 Connecting to database...');
    
    console.log('🧹 Cleaning old demo data...');
    await pool.query(`
      DELETE FROM chapter_pages WHERE chapter_id IN (SELECT id FROM chapters WHERE manhwa_id IN (SELECT id FROM manhwas WHERE created_by = '00000000-0000-0000-0000-000000000001'));
      DELETE FROM chapters WHERE manhwa_id IN (SELECT id FROM manhwas WHERE created_by = '00000000-0000-0000-0000-000000000001');
      DELETE FROM manhwas WHERE created_by = '00000000-0000-0000-0000-000000000001';
    `);
    console.log('✅ Old data cleaned');
    
    const files = [
      'scripts/03-enhanced-seed-data.sql',
      'scripts/04-seed-chapters-pages.sql', 
      'scripts/05-seed-chapter-pages.sql'
    ];

    for (const file of files) {
      console.log(`\n📥 Importing ${file}...`);
      const sql = fs.readFileSync(file, 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} imported`);
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM manhwas) as manhwas,
        (SELECT COUNT(*) FROM chapters) as chapters,
        (SELECT COUNT(*) FROM chapter_pages) as pages
    `);

    console.log('\n🎉 Seed Complete!');
    console.log(`📚 Manhwas: ${result.rows[0].manhwas}`);
    console.log(`📖 Chapters: ${result.rows[0].chapters}`);
    console.log(`🖼️  Pages: ${result.rows[0].pages}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetAndSeed();
