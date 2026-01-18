const { Pool } = require('pg');
const fs = require('fs');

async function importSeedData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:amrverse123@localhost:5432/amrverse'
  });

  try {
    console.log('🔌 Connecting to database...');
    
    const files = [
      'scripts/03-enhanced-seed-data.sql',
      'scripts/04-seed-chapters-pages.sql', 
      'scripts/05-seed-chapter-pages.sql'
    ];

    for (const file of files) {
      console.log(`\n📥 Importing ${file}...`);
      const sql = fs.readFileSync(file, 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} imported successfully`);
    }

    const manhwaCount = await pool.query('SELECT COUNT(*) FROM manhwas');
    const chapterCount = await pool.query('SELECT COUNT(*) FROM chapters');
    const pageCount = await pool.query('SELECT COUNT(*) FROM chapter_pages');

    console.log('\n🎉 Import Complete!');
    console.log(`📚 Manhwas: ${manhwaCount.rows[0].count}`);
    console.log(`📖 Chapters: ${chapterCount.rows[0].count}`);
    console.log(`🖼️  Pages: ${pageCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importSeedData();
