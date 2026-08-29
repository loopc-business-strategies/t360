import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const PERMISSIONS = [
  "dashboard.view",
  "products.read",
  "products.create",
  "products.update",
  "products.delete",
  "categories.manage",
  "brands.manage",
  "inventory.read",
  "inventory.update",
  "inventory.transfer",
  "inventory.adjust",
  "orders.read",
  "orders.update",
  "orders.cancel",
  "customers.read",
  "customers.update",
  "payments.read",
  "payments.refund",
  "shipments.read",
  "shipments.update",
  "coupons.manage",
  "offers.manage",
  "loyalty.manage",
  "reviews.moderate",
  "collections.manage",
  "storefront.edit",
  "reports.read",
  "staff.manage",
  "roles.manage",
  "settings.manage",
  "integrations.manage",
  "audit.read",
  "cms.manage",
  "ai.admin",
  "ai.fashion",
  "ai_fashion.view",
  "ai_fashion.generate",
  "ai_fashion.approve",
  "ai_fashion.delete",
  "ai_fashion.retry",
  "ai_models.view",
  "ai_models.create",
  "ai_models.update",
  "ai_models.delete",
  "ai_settings.view",
  "ai_settings.update",
  "ai.tryon.read",
  "ai.tryon.manage",
  "ai.tryon.delete",
  "whatsapp.manage",
  "notifications.manage",
  "support.manage",
  "branches.manage",
];

const ROLES: Record<string, { name: string; permissions: string[] | "*" }> = {
  SuperAdmin: { name: "Super Admin / Owner", permissions: "*" },
  Manager: {
    name: "Manager",
    permissions: [
      "dashboard.view",
      "products.read",
      "products.create",
      "products.update",
      "inventory.read",
      "inventory.update",
      "orders.read",
      "orders.update",
      "customers.read",
      "reports.read",
      "shipments.read",
      "shipments.update",
      "ai.fashion",
      "ai_fashion.view",
      "ai_fashion.generate",
      "ai_fashion.approve",
      "ai_fashion.delete",
      "ai_fashion.retry",
      "ai_models.view",
      "ai_models.create",
      "ai_models.update",
      "ai_settings.view",
      "ai.tryon.read",
      "ai.tryon.manage",
      "staff.manage",
      "audit.read",
    ],
  },
  ProductManager: {
    name: "Product Manager",
    permissions: [
      "dashboard.view",
      "products.read",
      "products.create",
      "products.update",
      "products.delete",
      "categories.manage",
      "brands.manage",
      "ai_fashion.view",
      "ai_fashion.generate",
      "ai_fashion.approve",
      "ai_fashion.retry",
      "ai_models.view",
      "ai_models.create",
      "ai_models.update",
    ],
  },
  SalesManager: {
    name: "Sales Manager",
    permissions: [
      "dashboard.view",
      "products.read",
      "inventory.read",
      "orders.read",
      "orders.update",
      "orders.cancel",
      "customers.read",
      "customers.update",
      "reports.read",
    ],
  },
  InventoryManager: {
    name: "Inventory Manager",
    permissions: [
      "dashboard.view",
      "products.read",
      "inventory.read",
      "inventory.update",
      "inventory.transfer",
      "inventory.adjust",
      "reports.read",
    ],
  },
  SalesStaff: {
    name: "Sales Staff",
    permissions: [
      "dashboard.view",
      "products.read",
      "inventory.read",
      "orders.read",
      "orders.update",
      "customers.read",
    ],
  },
  MarketingStaff: {
    name: "Marketing Staff",
    permissions: [
      "dashboard.view",
      "coupons.manage",
      "offers.manage",
      "cms.manage",
      "customers.read",
      "reports.read",
      "notifications.manage",
      "whatsapp.manage",
      "ai.fashion",
      "ai_fashion.view",
      "ai_fashion.generate",
      "ai_fashion.approve",
      "ai_models.view",
      "ai_models.create",
    ],
  },
  CustomerSupport: {
    name: "Customer Support",
    permissions: ["dashboard.view", "customers.read", "orders.read", "support.manage", "reviews.moderate"],
  },
  DeliveryStaff: {
    name: "Delivery Staff",
    permissions: ["dashboard.view", "shipments.read", "shipments.update", "orders.read"],
  },
  Accountant: {
    name: "Accountant",
    permissions: ["dashboard.view", "payments.read", "payments.refund", "orders.read", "reports.read"],
  },
  SystemAdministrator: {
    name: "System Administrator",
    permissions: [
      "dashboard.view",
      "settings.manage",
      "integrations.manage",
      "audit.read",
      "roles.manage",
      "staff.manage",
      "ai_settings.view",
      "ai_settings.update",
    ],
  },
};

async function main() {
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const byCode = Object.fromEntries(allPermissions.map((p) => [p.code, p]));

  for (const [code, def] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { code },
      create: { code, name: def.name },
      update: { name: def.name },
    });

    const permissionCodes = def.permissions === "*" ? PERMISSIONS : def.permissions;
    for (const permCode of permissionCodes) {
      const permission = byCode[permCode];
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "owner@tharagai.local";
  const isProduction = process.env.NODE_ENV === "production";
  const defaultPassword = "TharagaiOwner!123";
  const password = process.env.SEED_ADMIN_PASSWORD ?? (isProduction ? "" : defaultPassword);

  if (isProduction && !password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required in production. Refusing to seed with a default admin password.",
    );
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      status: "active",
      employee: {
        create: { name: "Tharagai Owner", employeeCode: "ADMIN001" },
      },
    },
    update: {
      passwordHash,
      status: "active",
    },
  });

  await prisma.employee.upsert({
    where: { userId: user.id },
    create: { userId: user.id, name: "Tharagai Owner", employeeCode: "ADMIN001" },
    update: { employeeCode: "ADMIN001", name: "Tharagai Owner" },
  });

  const superAdmin = await prisma.role.findUniqueOrThrow({ where: { code: "SuperAdmin" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } },
    create: { userId: user.id, roleId: superAdmin.id },
    update: {},
  });

  await prisma.systemSetting.upsert({
    where: { key: "business.name" },
    create: { key: "business.name", value: "Tharagai Readymades" },
    update: { value: "Tharagai Readymades" },
  });

  for (const [key, value] of [
    ["business.phone", "+91 4322 000000"],
    ["business.email", "hello@tharagai.local"],
    ["business.address", "Pudukkottai, Tamil Nadu"],
    ["business.timezone", "Asia/Kolkata"],
    ["business.currency", "INR"],
    ["business.language", "en"],
    ["media.maxUploadBytes", 12_000_000],
    ["social.instagram", process.env.SEED_SOCIAL_INSTAGRAM ?? ""],
    ["social.facebook", process.env.SEED_SOCIAL_FACEBOOK ?? ""],
    ["social.youtube", process.env.SEED_SOCIAL_YOUTUBE ?? ""],
  ] as const) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }

  await prisma.branch.upsert({
    where: { code: "PDK01" },
    create: {
      code: "PDK01",
      name: "Tharagai Pudukkottai",
      address: "Pudukkottai, Tamil Nadu, India",
      phone: "+914322000000",
      hours: { monFri: "10:00-21:00", satSun: "10:00-22:00" },
      status: "active",
    },
    update: { status: "active", deletedAt: null, name: "Tharagai Pudukkottai" },
  });

  await prisma.systemSetting.upsert({
    where: { key: "storefront.hero" },
    create: {
      key: "storefront.hero",
      value: {
        imageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&h=1200&q=80",
        desktopImageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&h=1200&q=80",
        mobileImageUrl:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&h=1200&q=80",
        en: {
          headline: "Readymades for every celebration",
          support:
            "Premium family fashion from Pudukkottai — wedding wear, ethnic sets, and everyday elegance.",
        },
        ta: {
          headline: "எல்லா கொண்டாட்டங்களுக்கும் ரெடிமேட்ஸ்",
          support:
            "புதுக்கோட்டையிலிருந்து உயர்தர குடும்ப ஆடைகள் — திருமண உடைகள், எத்னிக் செட்கள், அன்றாட நேர்த்தி.",
        },
      },
    },
    update: {
      value: {
        imageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&h=1200&q=80",
        desktopImageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&h=1200&q=80",
        mobileImageUrl:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&h=1200&q=80",
        en: {
          headline: "Readymades for every celebration",
          support:
            "Premium family fashion from Pudukkottai — wedding wear, ethnic sets, and everyday elegance.",
        },
        ta: {
          headline: "எல்லா கொண்டாட்டங்களுக்கும் ரெடிமேட்ஸ்",
          support:
            "புதுக்கோட்டையிலிருந்து உயர்தர குடும்ப ஆடைகள் — திருமண உடைகள், எத்னிக் செட்கள், அன்றாட நேர்த்தி.",
        },
      },
    },
  });

  for (const [key, value] of [
    ["commerce.codEnabled", true],
    ["commerce.shippingFee", 49],
    ["commerce.freeShippingAbove", 999],
    ["loyalty.earnPerRupee", 1],
    ["loyalty.redeemValuePerPoint", 0.25],
    ["loyalty.maxRedeemPercent", 20],
    ["marketing.abandonedCartEnabled", true],
    ["marketing.abandonedCartDelayHours", 24],
    ["marketing.abandonedCartMaxReminders", 1],
    ["ai.enabled", true],
    ["ai.fashion.enabled", false],
    ["feature.mobile_admin.enabled", true],
    ["feature.ai_fashion.enabled", false],
    [
      "ai.fashion.config",
      {
        defaultNumImages: 1,
        defaultModelId: null,
        autoGenerateOnCreate: false,
        dailyLimit: 20,
        monthlyLimit: 200,
        defaultResolution: "1k",
        defaultGenerationMode: "fast",
        maintenanceMode: false,
        productToModelEnabled: true,
        virtualTryOnEnabled: true,
        modelCreationEnabled: true,
        videoEnabled: false,
        requireApproval: true,
        maxImagesPerJob: 4,
        maxConcurrentJobs: 6,
      },
    ],
    [
      "ai.tryon.config",
      {
        enabled: true,
        maxImageBytes: 8_000_000,
        retentionHours: 24,
        perUserPerHour: 10,
        maxConcurrentPerUser: 2,
        consentRequired: true,
        allowCamera: true,
        allowUpload: true,
      },
    ],
  ] as const) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      minOrder: 499,
      maxUses: 1000,
      perCustomerLimit: 1,
      active: true,
    },
    update: { active: true },
  });
  await prisma.coupon.upsert({
    where: { code: "FLAT100" },
    create: {
      code: "FLAT100",
      type: "fixed",
      value: 100,
      minOrder: 999,
      maxUses: 500,
      perCustomerLimit: 2,
      active: true,
    },
    update: { active: true },
  });

  const templates: Array<{
    code: string;
    channel: string;
    locale: string;
    subject?: string;
    body: string;
  }> = [
    {
      code: "order.confirmed",
      channel: "email",
      locale: "en",
      subject: "Order {{number}} confirmed",
      body: "Your order {{number}} is confirmed. Total ₹{{total}}.",
    },
    {
      code: "order.confirmed",
      channel: "sms",
      locale: "en",
      body: "THARAGAI: Order {{number}} confirmed. Total ₹{{total}}.",
    },
    {
      code: "order.confirmed",
      channel: "push",
      locale: "en",
      subject: "Order confirmed",
      body: "Order {{number}} confirmed",
    },
    {
      code: "order.confirmed",
      channel: "whatsapp",
      locale: "en",
      body: "Order {{number}} confirmed. Total ₹{{total}}.",
    },
    {
      code: "order.shipped",
      channel: "email",
      locale: "en",
      subject: "Order {{number}} on the way",
      body: "Order {{number}} is packed / out for delivery.",
    },
    {
      code: "order.shipped",
      channel: "sms",
      locale: "en",
      body: "THARAGAI: Order {{number}} is on the way.",
    },
    {
      code: "order.shipped",
      channel: "push",
      locale: "en",
      subject: "On the way",
      body: "Order {{number}} shipped",
    },
    {
      code: "order.shipped",
      channel: "whatsapp",
      locale: "en",
      body: "Order {{number}} is on the way.",
    },
    {
      code: "order.delivered",
      channel: "email",
      locale: "en",
      subject: "Order {{number}} delivered",
      body: "Your order {{number}} was delivered. Thank you!",
    },
    {
      code: "order.delivered",
      channel: "sms",
      locale: "en",
      body: "THARAGAI: Order {{number}} delivered. Thank you!",
    },
    {
      code: "order.delivered",
      channel: "push",
      locale: "en",
      subject: "Delivered",
      body: "Order {{number}} delivered",
    },
    {
      code: "order.delivered",
      channel: "whatsapp",
      locale: "en",
      body: "Order {{number}} delivered. Thank you!",
    },
    {
      code: "order.cancelled",
      channel: "email",
      locale: "en",
      subject: "Order {{number}} cancelled",
      body: "Order {{number}} was cancelled.",
    },
    {
      code: "order.cancelled",
      channel: "sms",
      locale: "en",
      body: "THARAGAI: Order {{number}} cancelled.",
    },
    {
      code: "order.cancelled",
      channel: "push",
      locale: "en",
      subject: "Cancelled",
      body: "Order {{number}} cancelled",
    },
    {
      code: "order.cancelled",
      channel: "whatsapp",
      locale: "en",
      body: "Order {{number}} cancelled.",
    },
    {
      code: "auth.otp",
      channel: "sms",
      locale: "en",
      body: "Your THARAGAI OTP is {{code}}",
    },
    {
      code: "order.confirmed",
      channel: "sms",
      locale: "ta",
      body: "தாரகை: ஆர்டர் {{number}} உறுதி. மொத்தம் ₹{{total}}.",
    },
    {
      code: "campaign.broadcast",
      channel: "email",
      locale: "en",
      subject: "{{subject}}",
      body: "{{body}}",
    },
    {
      code: "campaign.broadcast",
      channel: "sms",
      locale: "en",
      body: "THARAGAI: {{body}}",
    },
    {
      code: "campaign.broadcast",
      channel: "push",
      locale: "en",
      subject: "{{subject}}",
      body: "{{body}}",
    },
    {
      code: "campaign.broadcast",
      channel: "whatsapp",
      locale: "en",
      body: "{{body}}",
    },
    {
      code: "cart.abandoned",
      channel: "email",
      locale: "en",
      subject: "You left items in your bag",
      body: "Your Tharagai bag is waiting. Complete checkout when ready.",
    },
    {
      code: "cart.abandoned",
      channel: "sms",
      locale: "en",
      body: "THARAGAI: Your bag is waiting — complete checkout anytime.",
    },
    {
      code: "cart.abandoned",
      channel: "push",
      locale: "en",
      subject: "Bag waiting",
      body: "Complete your Tharagai checkout",
    },
    {
      code: "cart.abandoned",
      channel: "whatsapp",
      locale: "en",
      body: "Your Tharagai bag is waiting. Complete checkout when ready.",
    },
    {
      code: "ai_fashion.completed",
      channel: "push",
      locale: "en",
      subject: "AI Fashion ready",
      body: "Your AI Fashion image is ready to review.",
    },
    {
      code: "ai_fashion.failed",
      channel: "push",
      locale: "en",
      subject: "AI Fashion failed",
      body: "AI Fashion generation failed. You can retry from the admin app.",
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        code_channel_locale: { code: t.code, channel: t.channel, locale: t.locale },
      },
      create: t,
      update: { subject: t.subject ?? null, body: t.body, active: true },
    });
  }

  const segment = await prisma.segment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000101" },
    create: {
      id: "00000000-0000-4000-8000-000000000101",
      name: "Repeat buyers",
      rules: { minOrders: 2, minSpend: 1000, hasMobile: true },
      active: true,
    },
    update: { active: true, rules: { minOrders: 2, minSpend: 1000, hasMobile: true } },
  });

  await prisma.campaign.upsert({
    where: { id: "00000000-0000-4000-8000-000000000102" },
    create: {
      id: "00000000-0000-4000-8000-000000000102",
      name: "Welcome festival draft",
      status: "draft",
      channels: ["email", "sms"],
      segmentId: segment.id,
      couponCode: "WELCOME10",
      subject: "Festival picks for you",
      body: "Discover new arrivals at Tharagai. Use WELCOME10 at checkout.",
    },
    update: { status: "draft" },
  });

  await prisma.socialPost.upsert({
    where: { id: "00000000-0000-4000-8000-000000000103" },
    create: {
      id: "00000000-0000-4000-8000-000000000103",
      platform: "instagram",
      title: "New silk arrivals",
      body: "Fresh silk collection in-store and online. #Tharagai #Pudukkottai",
      status: "draft",
    },
    update: { status: "draft" },
  });

  await prisma.integration.upsert({
    where: { provider_kind: { provider: "mock", kind: "pos" } },
    create: {
      provider: "mock",
      kind: "pos",
      status: "ready",
      credentialsRef: "mock://local",
      syncCursor: {},
      config: { label: "Mock POS adapter" },
    },
    update: { status: "ready" },
  });

  await prisma.searchSynonym.deleteMany({ where: { term: "saree" } });
  await prisma.searchSynonym.upsert({
    where: { term: "chudidar" },
    create: {
      term: "chudidar",
      aliases: ["chudi", "churidar", "சுடிதார்", "salwar"],
      locale: "en",
      active: true,
    },
    update: { aliases: ["chudi", "churidar", "சுடிதார்", "salwar"], active: true },
  });
  await prisma.searchSynonym.upsert({
    where: { term: "kurti" },
    create: {
      term: "kurti",
      aliases: ["kurthi", "குர்த்தி", "kurtis"],
      locale: "en",
      active: true,
    },
    update: { aliases: ["kurthi", "குர்த்தி", "kurtis"], active: true },
  });
  await prisma.searchSynonym.upsert({
    where: { term: "shirt" },
    create: {
      term: "shirt",
      aliases: ["shirts", "சட்டை", "formal shirt", "casual shirt"],
      locale: "en",
      active: true,
    },
    update: { aliases: ["shirts", "சட்டை", "formal shirt", "casual shirt"], active: true },
  });
  await prisma.searchSynonym.upsert({
    where: { term: "kids wear" },
    create: {
      term: "kids wear",
      aliases: ["kids", "children", "boys", "girls", "குழந்தை"],
      locale: "en",
      active: true,
    },
    update: { aliases: ["kids", "children", "boys", "girls", "குழந்தை"], active: true },
  });

  const { seedDemoCatalog } = await import("../../apps/api/src/demo-data/engine/seed");
  const demoResult = await seedDemoCatalog(prisma);
  console.log("Demo catalog:", demoResult);

  const { hideSareeCatalog } = await import("./hide-saree-catalog");
  const sareeHide = await hideSareeCatalog(prisma);
  console.log("Saree catalog hidden:", sareeHide);

  // Keep legacy inventory helper for any non-demo variants still present
  const { seedInventory } = await import("./seed-inventory");
  await seedInventory(prisma);

  console.log("Seed complete.");
  console.log(`SuperAdmin: ${email}`);
  if (!isProduction) {
    console.log("Password: (dev seed — set SEED_ADMIN_PASSWORD and change before production)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
