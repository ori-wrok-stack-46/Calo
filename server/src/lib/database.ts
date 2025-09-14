import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Database connection configuration
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  return url;
};

// Database cleanup utilities
export class DatabaseCleanup {
  static async checkDatabaseSize(): Promise<{
    size: number;
    maxSize: number;
    needsCleanup: boolean;
  }> {
    try {
      const dbUrl = getDatabaseUrl();
      if (dbUrl.includes("file:")) {
        const dbPath = dbUrl.replace("file:", "");
        const stats = fs.statSync(dbPath);
        const sizeInMB = stats.size / (1024 * 1024);
        const maxSizeInMB = 100; // 100MB limit

        return {
          size: sizeInMB,
          maxSize: maxSizeInMB,
          needsCleanup: sizeInMB > maxSizeInMB * 0.8, // Cleanup at 80%
        };
      }
      return { size: 0, maxSize: 100, needsCleanup: false };
    } catch (error) {
      console.error("Error checking database size:", error);
      return { size: 0, maxSize: 100, needsCleanup: true };
    }
  }

  static async emergencyCleanup(): Promise<void> {
    try {
      console.log("🚨 Starting emergency database cleanup...");

      // 1. Clean old chat messages (keep last 50 per user)
      const chatCleanup = await prisma.$executeRaw`
        DELETE FROM "ChatMessage" 
        WHERE message_id NOT IN (
          SELECT message_id FROM (
            SELECT message_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM "ChatMessage"
          ) ranked
          WHERE rn <= 50
        )
      `;

      // 2. Clean old AI recommendations (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const aiCleanup = await prisma.aiRecommendation.deleteMany({
        where: {
          created_at: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // 3. Clean expired sessions
      const sessionCleanup = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // 4. VACUUM to reclaim space
      await prisma.$executeRaw`VACUUM`;

      console.log(`✅ Emergency cleanup completed:
        - Chat messages cleaned
        - AI recommendations cleaned: ${aiCleanup.count}
        - Sessions cleaned: ${sessionCleanup.count}
        - Database vacuumed`);
    } catch (error) {
      console.error("❌ Emergency cleanup failed:", error);
      throw error;
    }
  }

  static async preventiveCleanup(): Promise<void> {
    try {
      const sizeCheck = await this.checkDatabaseSize();

      if (sizeCheck.needsCleanup) {
        console.log(
          `📊 Database size: ${sizeCheck.size.toFixed(2)}MB / ${
            sizeCheck.maxSize
          }MB - Running cleanup...`
        );
        await this.emergencyCleanup();
      } else {
        console.log(
          `📊 Database size: ${sizeCheck.size.toFixed(2)}MB / ${
            sizeCheck.maxSize
          }MB - No cleanup needed`
        );
      }
    } catch (error) {
      console.error("Error in preventive cleanup:", error);
    }
  }
}

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "pretty",
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

// Test database connection and run initial cleanup
prisma
  .$connect()
  .then(async () => {
    console.log("✅ Database connected successfully");

    // Run initial size check and cleanup if needed
    try {
      await DatabaseCleanup.preventiveCleanup();

      // Set up periodic cleanup (every 6 hours)
      setInterval(async () => {
        await DatabaseCleanup.preventiveCleanup();
      }, 6 * 60 * 60 * 1000);
    } catch (error) {
      console.error("⚠️ Initial cleanup failed:", error);
    }
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
  });

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
