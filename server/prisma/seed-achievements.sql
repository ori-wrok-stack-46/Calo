
-- CreateTable for comprehensive achievements system
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "max_progress" INTEGER NOT NULL DEFAULT 1,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- Create unique index on key
CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_key_key" ON "Achievement"("key");

-- Insert comprehensive achievements
INSERT INTO "Achievement" ("id", "key", "title", "description", "category", "max_progress", "points_awarded", "icon", "rarity") VALUES
-- First Steps
('ach_001', 'first_scan', 'First Steps', 'Analyze your first meal', 'MILESTONE', 1, 50, '🎯', 'COMMON'),
('ach_002', 'first_water_goal', 'Hydration Hero', 'Complete your first water goal (8 cups)', 'GOAL', 1, 100, '💧', 'COMMON'),
('ach_003', 'first_complete_day', 'Perfect Day', 'Complete both water and calorie goals in one day', 'MILESTONE', 1, 150, '✨', 'RARE'),

-- Streak Achievements
('ach_004', 'streak_3_days', 'Getting Started', 'Maintain a 3-day streak', 'STREAK', 3, 200, '🔥', 'COMMON'),
('ach_005', 'streak_7_days', 'Week Warrior', 'Maintain a 7-day streak', 'STREAK', 7, 500, '📅', 'UNCOMMON'),
('ach_006', 'streak_14_days', 'Fortnight Fighter', 'Maintain a 14-day streak', 'STREAK', 14, 1000, '💪', 'RARE'),
('ach_007', 'streak_30_days', 'Monthly Master', 'Maintain a 30-day streak', 'STREAK', 30, 2500, '👑', 'EPIC'),
('ach_008', 'streak_100_days', 'Century Champion', 'Maintain a 100-day streak', 'STREAK', 100, 10000, '🏆', 'LEGENDARY'),

-- Water Achievements
('ach_009', 'water_warrior', 'Water Warrior', 'Drink 10+ cups of water in a day', 'GOAL', 1, 200, '🌊', 'UNCOMMON'),
('ach_010', 'hydration_habit', 'Hydration Habit', 'Meet water goals for 7 consecutive days', 'STREAK', 7, 750, '💦', 'RARE'),
('ach_011', 'aqua_master', 'Aqua Master', 'Meet water goals for 30 days total', 'GOAL', 30, 1500, '🏔️', 'EPIC'),

-- Total Completion Achievements
('ach_012', 'total_5_days', 'Getting the Hang', '5 total complete days', 'MILESTONE', 5, 250, '🌟', 'COMMON'),
('ach_013', 'total_10_days', 'Double Digits', '10 total complete days', 'MILESTONE', 10, 500, '⭐', 'UNCOMMON'),
('ach_014', 'total_25_days', 'Quarter Century', '25 total complete days', 'MILESTONE', 25, 1250, '🎖️', 'RARE'),
('ach_015', 'total_50_days', 'Half Century', '50 total complete days', 'MILESTONE', 50, 2500, '🥇', 'EPIC'),
('ach_016', 'total_100_days', 'Centurion', '100 total complete days', 'MILESTONE', 100, 5000, '👑', 'LEGENDARY'),

-- Calorie & Nutrition Achievements
('ach_017', 'calorie_champion', 'Calorie Champion', 'Meet calorie goals for 7 consecutive days', 'STREAK', 7, 750, '🍎', 'RARE'),
('ach_018', 'protein_power', 'Protein Power', 'Consume 100g+ protein in a day', 'GOAL', 1, 300, '💪', 'UNCOMMON'),
('ach_019', 'balanced_week', 'Balanced Week', 'Meet all macro goals for 7 consecutive days', 'STREAK', 7, 1000, '⚖️', 'EPIC'),

-- Level Achievements
('ach_020', 'level_5', 'Rising Star', 'Reach Level 5', 'LEVEL', 5, 500, '⭐', 'COMMON'),
('ach_021', 'level_10', 'Dedicated User', 'Reach Level 10', 'LEVEL', 10, 1000, '🌟', 'UNCOMMON'),
('ach_022', 'level_25', 'Expert Tracker', 'Reach Level 25', 'LEVEL', 25, 2500, '🔥', 'RARE'),
('ach_023', 'level_50', 'Nutrition Master', 'Reach Level 50', 'LEVEL', 50, 5000, '👑', 'EPIC'),

-- Special Achievements
('ach_024', 'early_bird', 'Early Bird', 'Log a meal before 8 AM', 'SPECIAL', 1, 100, '🐦', 'UNCOMMON'),
('ach_025', 'night_owl', 'Night Owl', 'Log a meal after 10 PM', 'SPECIAL', 1, 100, '🦉', 'UNCOMMON'),
('ach_026', 'weekend_warrior', 'Weekend Warrior', 'Complete goals on both Saturday and Sunday', 'SPECIAL', 1, 300, '🎯', 'RARE'),
('ach_027', 'consistency_king', 'Consistency King', 'Log meals every day for a week', 'STREAK', 7, 1000, '📊', 'EPIC'),

-- Advanced Achievements
('ach_028', 'macro_master', 'Macro Master', 'Hit perfect macro ratios (40/30/30) for a day', 'GOAL', 1, 500, '🎯', 'RARE'),
('ach_029', 'fiber_friend', 'Fiber Friend', 'Consume 35g+ fiber in a day', 'GOAL', 1, 250, '🌾', 'UNCOMMON'),
('ach_030', 'iron_will', 'Iron Will', 'Complete goals for 365 days total', 'MILESTONE', 365, 25000, '💎', 'LEGENDARY');

-- Update existing records to have proper timestamps
UPDATE "Achievement" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;
