// prisma/backup.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');




const prisma = new PrismaClient();
const backupDir = path.join(__dirname, '_backups');

async function backup() {
  console.log('✅ شروع پروسه پشتیبان‌گیری...');

  try {
    // ایجاد فولدر بک‌آپ اگر وجود ندارد
    if (!await fs.stat(backupDir).catch(() => false)) {
      await fs.mkdir(backupDir);
    }

    // فقط مدل‌هایی که متد findMany دارند
    const modelNames = Object.keys(prisma).filter(
      k => typeof prisma[k]?.findMany === 'function'
    );

    for (const modelName of modelNames) {
      console.log(`⏳ در حال پشتیبان‌گیری از جدول: ${modelName}`);

      try {
        const data = await prisma[modelName].findMany();
        if (data.length > 0) {
          const filePath = path.join(backupDir, `${modelName}.json`);
          await fs.writeFile(filePath, JSON.stringify(data, null, 2));
          console.log(`✔️ ${data.length} رکورد از جدول ${modelName} ذخیره شد.`);
        } else {
          console.log(`- جدول ${modelName} خالی است و نادیده گرفته شد.`);
        }
      } catch (err) {
        console.error(`❌ خطا در بک‌آپ جدول ${modelName}:`, err.message);
      }
    }

    console.log('🎉 پشتیبان‌گیری با موفقیت کامل شد!');
  } catch (error) {
    console.error('❌ خطا در هنگام پشتیبان‌گیری:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
