/**
 * 批量导入团支书名单
 *
 * 用法（本地开发）:
 *   node scripts/import-secretaries.js
 *
 * 用法（Docker 容器）:
 *   docker exec liguiyu-home node scripts/import-secretaries.js
 *   或
 *   docker exec liguiyu-admin node scripts/import-secretaries.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "data", "liguiyu.db");

const secretaries = [
  { class_id: "0625001", name: "冯达博" },
  { class_id: "0625002", name: "赵润辰" },
  { class_id: "0625101", name: "王炳润" },
  { class_id: "0625102", name: "徐泽东" },
  { class_id: "0625103", name: "王垠博" },
  { class_id: "0625201", name: "高浩哲" },
  { class_id: "0625501", name: "李萌" },
  { class_id: "0625502", name: "赵欣瑜" },
  { class_id: "0625601", name: "彭开颜" },
  { class_id: "0825101", name: "樊亿" },
  { class_id: "0825201", name: "郝泽涛" },
  { class_id: "0825202", name: "范博皓" },
  { class_id: "0825401", name: "陆婧" },
  { class_id: "0825102", name: "樊敏正" },
  { class_id: "1625001", name: "蒋开来" },
  { class_id: "1625101", name: "黄鹏" },
  { class_id: "1625102", name: "王怡" },
  { class_id: "1625103", name: "李佳逸" },
  { class_id: "1625104", name: "刘玉涵" },
  { class_id: "1625201", name: "曹博远" },
  { class_id: "1625202", name: "罗湘然" },
  { class_id: "1625203", name: "刘静雯" },
  { class_id: "1625301", name: "杨雅毅" },
  { class_id: "1625302", name: "韩钾厚" },
  { class_id: "1625303", name: "姚亦辰" },
  { class_id: "1625401", name: "项宇浩" },
  { class_id: "1625402", name: "叶耀祖" },
  { class_id: "2425101", name: "段潮生" },
  { class_id: "2425102", name: "宫浩然" },
];

console.log(`📋 准备导入 ${secretaries.length} 位团支书...`);
console.log(`📂 数据库: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS league_secretaries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_league_secretaries_class ON league_secretaries(class_id);
`);

const now = Math.floor(Date.now() / 1000);
let added = 0;
let skipped = 0;

const insert = db.prepare(
  "INSERT OR IGNORE INTO league_secretaries (id, name, class_id, created_at) VALUES (?, ?, ?, ?)"
);

for (const s of secretaries) {
  const id = crypto.randomUUID();
  const result = insert.run(id, s.name, s.class_id, now);
  if (result.changes > 0) {
    console.log(`  ✅ ${s.class_id}  ${s.name}`);
    added++;
  } else {
    console.log(`  ⏭️ ${s.class_id}  ${s.name} (已存在，跳过)`);
    skipped++;
  }
}

db.close();

console.log(`\n🎉 完成！新增 ${added} 人，跳过 ${skipped} 人（已存在）。`);
