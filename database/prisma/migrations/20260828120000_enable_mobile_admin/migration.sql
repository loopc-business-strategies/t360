-- Enable mobile admin for staff APK (production was seeded false or missing).
INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'feature.mobile_admin.enabled', 'true'::jsonb, NOW(), NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = 'true'::jsonb, "updatedAt" = NOW();
