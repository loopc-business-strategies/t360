-- Path A: ensure AI Fashion RBAC perms exist and Path A cost defaults (stills, video off, fast/1k).

INSERT INTO "Permission" ("id", "code", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.code, v.code, NOW(), NOW()
FROM (VALUES
  ('ai.fashion'),
  ('ai_fashion.view'),
  ('ai_fashion.generate'),
  ('ai_fashion.approve'),
  ('ai_fashion.delete'),
  ('ai_fashion.retry'),
  ('ai_models.view'),
  ('ai_models.create'),
  ('ai_models.update'),
  ('ai_models.delete'),
  ('ai_settings.view'),
  ('ai_settings.update')
) AS v(code)
WHERE NOT EXISTS (
  SELECT 1 FROM "Permission" p WHERE p."code" = v.code
);

-- SuperAdmin: all AI fashion/settings perms
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."code" = 'SuperAdmin'
  AND p."code" IN (
    'ai.fashion',
    'ai_fashion.view',
    'ai_fashion.generate',
    'ai_fashion.approve',
    'ai_fashion.delete',
    'ai_fashion.retry',
    'ai_models.view',
    'ai_models.create',
    'ai_models.update',
    'ai_models.delete',
    'ai_settings.view',
    'ai_settings.update'
  )
ON CONFLICT DO NOTHING;

-- Manager / MarketingStaff / ProductManager (subset aligned with seed)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."code" = 'Manager'
  AND p."code" IN (
    'ai.fashion',
    'ai_fashion.view',
    'ai_fashion.generate',
    'ai_fashion.approve',
    'ai_fashion.delete',
    'ai_fashion.retry',
    'ai_models.view',
    'ai_models.create',
    'ai_models.update',
    'ai_settings.view'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."code" = 'ProductManager'
  AND p."code" IN (
    'ai_fashion.view',
    'ai_fashion.generate',
    'ai_fashion.approve',
    'ai_fashion.retry',
    'ai_models.view',
    'ai_models.create',
    'ai_models.update'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."code" = 'MarketingStaff'
  AND p."code" IN (
    'ai.fashion',
    'ai_fashion.view',
    'ai_fashion.generate',
    'ai_fashion.approve',
    'ai_models.view',
    'ai_settings.view',
    'ai_settings.update'
  )
ON CONFLICT DO NOTHING;

-- Path A fashion config defaults (merge onto existing JSON if present)
INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'ai.fashion.config',
  '{"defaultNumImages":1,"defaultModelId":null,"autoGenerateOnCreate":false,"dailyLimit":20,"monthlyLimit":200,"defaultResolution":"1k","defaultGenerationMode":"fast","maintenanceMode":false,"productToModelEnabled":true,"virtualTryOnEnabled":true,"modelCreationEnabled":true,"videoEnabled":false,"requireApproval":true,"maxImagesPerJob":4,"maxConcurrentJobs":6}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT ("key") DO UPDATE
SET
  "value" = COALESCE("SystemSetting"."value", '{}'::jsonb) || EXCLUDED."value",
  "updatedAt" = NOW();
