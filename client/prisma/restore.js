// prisma/restore.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

// --- ست کردن DATABASE_URL مستقیماً ---
process.env.DATABASE_URL = "";
// جایگزین کنید username, password و dbname با مقادیر واقعی

const prisma = new PrismaClient();
const backupDir = path.join(__dirname, '_backups');

async function restore() {
  console.log('✅ شروع پروسه بازیابی بک‌آپ...');

  try {
    const files = await fs.readdir(backupDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log('- هیچ فایل بک‌آپی پیدا نشد.');
      return;
    }

    // ترتیب جدول‌ها برای جلوگیری از خطای FK
    const tableOrder = [
      "category",
      "supplier",
      "user",
      "product",
      "settlement",
      "order",
      "orderItem",
      "returnRequest",
      "returnRequestItem"
    ];

    for (const modelName of tableOrder) {
      const file = `${modelName}.json`;
      const filePath = path.join(backupDir, file);

      // اگر فایل موجود نیست، رد شود
      if (!jsonFiles.includes(file)) {
        console.log(`- فایل بک‌آپ برای جدول ${modelName} پیدا نشد، رد شد.`);
        continue;
      }

      console.log(`⏳ در حال بازیابی جدول: ${modelName}`);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (!Array.isArray(data) || data.length === 0) {
          console.log(`- فایل ${file} خالی است و نادیده گرفته شد.`);
          continue;
        }

        // پاک کردن جدول قبل از وارد کردن (اختیاری)
        await prisma[modelName].deleteMany();

        // وارد کردن داده‌ها
        await prisma[modelName].createMany({
          data,
          skipDuplicates: true // جلوگیری از تکراری شدن
        });

        console.log(`✔️ ${data.length} رکورد به جدول ${modelName} وارد شد.`);
      } catch (err) {
        console.error(`❌ خطا در بازیابی جدول ${modelName}:`, err.message);
      }
    }

    console.log('🎉 بازیابی بک‌آپ با موفقیت کامل شد!');
  } catch (error) {
    console.error('❌ خطا در هنگام بازیابی بک‌آپ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
