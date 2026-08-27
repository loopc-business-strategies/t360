import { z } from "zod";

/** Normalize Indian mobile to E.164 `+91XXXXXXXXXX`. */
export function normalizeIndianMobile(raw: string): string {
  let s = String(raw ?? "")
    .trim()
    .replace(/[\s\-()]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (/^\d{10}$/.test(s) && /^[6-9]/.test(s)) return `+91${s}`;
  if (/^91[6-9]\d{9}$/.test(s)) return `+${s}`;
  if (s.startsWith("+91") && s.length === 13) return s;
  return s;
}

const indianMobileE164 = z
  .string()
  .transform(normalizeIndianMobile)
  .refine((v) => /^\+91[6-9]\d{9}$/.test(v), {
    message: "Mobile must be E.164 Indian format +91XXXXXXXXXX",
  });

export const otpRequestSchema = z.object({
  mobile: indianMobileE164,
});

export const otpVerifySchema = z.object({
  mobile: indianMobileE164,
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const adminLoginSchema = z
  .object({
    email: z.string().email().optional(),
    employeeCode: z.string().min(2).max(40).optional(),
    password: z.string().min(8),
    mfaCode: z.string().length(6).optional(),
  })
  .refine((v) => Boolean(v.email || v.employeeCode), {
    message: "email or employeeCode is required",
    path: ["email"],
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

export const passwordForgotSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8).max(128),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PasswordForgotInput = z.infer<typeof passwordForgotSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema.optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const brandCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema.optional(),
  logoUrl: z.string().url().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const variantInputSchema = z.object({
  sku: z.string().min(1).max(64),
  barcode: z.string().max(64).optional().nullable(),
  price: z.number().positive(),
  cost: z.number().nonnegative().optional().nullable(),
  salePrice: z.number().positive().optional().nullable(),
  attributes: z.record(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema.optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional().nullable(),
  tryOnEnabled: z.boolean().optional(),
  variants: z.array(variantInputSchema).min(1),
  imageUrls: z.array(z.string().url()).optional(),
  attributeValues: z
    .array(z.object({ attributeCode: z.string(), value: z.string() }))
    .optional(),
  /** When true, enqueue AI Fashion generation after product images are saved */
  generateAiFashion: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  categoryId: z.string().uuid().optional(),
  variants: z.array(variantInputSchema).optional(),
  tryOnImageId: z.string().uuid().optional().nullable(),
  primaryImageId: z.string().uuid().optional().nullable(),
});

export const productListQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  size: z.string().optional(),
  colour: z.string().optional(),
  sort: z.enum(["relevance", "newest", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  availability: z.enum(["in_stock", "any"]).optional(),
  tryOnEnabled: z.coerce.boolean().optional(),
  branch: z.string().optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const customerProfileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  gender: z.string().max(40).optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
});

export const addressCreateSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  name: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Indian pincode must be 6 digits"),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressCreateSchema.partial();

export const wishlistAddSchema = z.object({
  variantId: z.string().uuid(),
});

export type CustomerProfileUpdateInput = z.infer<typeof customerProfileUpdateSchema>;
export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
export type WishlistAddInput = z.infer<typeof wishlistAddSchema>;

export const cartItemAddSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.number().int().positive().max(50),
  branchId: z.string().uuid().optional().nullable(),
});

export const cartItemUpdateSchema = z.object({
  qty: z.number().int().positive().max(50),
});

export const createOrderSchema = z.object({
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  addressId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  couponCode: z.string().min(2).max(40).optional(),
  loyaltyPointsToRedeem: z.number().int().nonnegative().optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "Pending",
    "PaymentPending",
    "Confirmed",
    "Processing",
    "Packed",
    "ReadyForPickup",
    "OutForDelivery",
    "Delivered",
    "Cancelled",
    "ReturnRequested",
    "Returned",
    "RefundPending",
    "Refunded",
  ]),
  note: z.string().max(500).optional(),
});

export const pickupVerifySchema = z.object({
  pickupCode: z.string().min(4).max(16),
});

export const couponCreateSchema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrder: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  perCustomerLimit: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  active: z.boolean().optional(),
});

export const couponUpdateSchema = couponCreateSchema.partial();

export const couponValidateSchema = z.object({
  code: z.string().min(2).max(40),
  subtotal: z.number().nonnegative(),
});

export const employeeCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  employeeCode: z.string().min(2).max(40).optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  roleCodes: z.array(z.string()).optional(),
});

export const employeeUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  employeeCode: z.string().min(2).max(40).optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  status: z.string().optional(),
});

export const employeeRolesSchema = z.object({
  roleCodes: z.array(z.string()).min(1),
});

export const rolePermissionsUpdateSchema = z.object({
  permissionCodes: z.array(z.string()).min(0),
});

export type RolePermissionsUpdateInput = z.infer<typeof rolePermissionsUpdateSchema>;

export const loyaltyAdjustSchema = z.object({
  delta: z.number().int(),
  reason: z.string().min(2).max(200),
});

export const adminCustomerUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  gender: z.string().max(40).optional().nullable(),
});

export const notificationPrefsUpdateSchema = z.object({
  marketingEmail: z.boolean().optional(),
  marketingSms: z.boolean().optional(),
  marketingPush: z.boolean().optional(),
  marketingWhatsapp: z.boolean().optional(),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(["android", "ios", "web"]),
});

export const segmentRulesSchema = z.object({
  minOrders: z.number().int().nonnegative().optional(),
  minSpend: z.number().nonnegative().optional(),
  hasMobile: z.boolean().optional(),
});

export const segmentCreateSchema = z.object({
  name: z.string().min(2).max(120),
  rules: segmentRulesSchema,
  active: z.boolean().optional(),
});

export const segmentUpdateSchema = segmentCreateSchema.partial();

export const campaignCreateSchema = z.object({
  name: z.string().min(2).max(120),
  channels: z.array(z.enum(["email", "sms", "push", "whatsapp"])).min(1),
  segmentId: z.string().uuid().optional().nullable(),
  couponCode: z.string().max(40).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(2).max(4000),
  scheduledAt: z.string().datetime().optional().nullable(),
  status: z.enum(["draft", "scheduled", "running", "completed", "cancelled"]).optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export const abandonedCartSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  delayHours: z.number().positive().max(720).optional(),
  maxReminders: z.number().int().positive().max(5).optional(),
});

export const socialPostCreateSchema = z.object({
  platform: z.enum(["instagram", "facebook", "whatsapp_status"]),
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(4000),
  mediaUrl: z.string().url().optional().nullable(),
  status: z.enum(["draft", "ready", "archived"]).optional(),
});

export const socialPostUpdateSchema = socialPostCreateSchema.partial();

export const aiChatSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  message: z.string().min(1).max(4000),
});

export const posIntegrationUpdateSchema = z.object({
  status: z.enum(["disabled", "ready", "error"]).optional(),
  config: z.record(z.unknown()).optional().nullable(),
});

export const posInventoryCsvImportSchema = z.object({
  csv: z.string().min(1).max(500_000),
});

export const posWebhookSchema = z.object({
  eventId: z.string().min(1).max(200),
  type: z.enum(["inventory.adjust", "inventory.set"]).default("inventory.adjust"),
  sku: z.string().max(80).optional().nullable(),
  barcode: z.string().max(80).optional().nullable(),
  branchCode: z.string().min(1).max(40),
  qtyDelta: z.number().int().optional(),
  physicalQty: z.number().int().nonnegative().optional(),
});

export const searchSynonymCreateSchema = z.object({
  term: z.string().min(1).max(80),
  aliases: z.array(z.string().min(1).max(80)).min(1).max(40),
  locale: z.enum(["en", "ta", "any"]).optional(),
  active: z.boolean().optional(),
});

export const searchSynonymUpdateSchema = searchSynonymCreateSchema.partial();

export const searchSuggestQuerySchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export const storefrontLocaleCopySchema = z.object({
  headline: z.string().min(1).max(200),
  support: z.string().min(1).max(1000),
  ctaLabel: z.string().min(1).max(80).optional(),
});

export const storefrontHeroSchema = z.object({
  imageUrl: z.string().url().max(2000),
  videoUrl: z.string().url().max(2000).optional(),
  en: storefrontLocaleCopySchema,
  ta: storefrontLocaleCopySchema,
});

const storefrontSectionBase = z.object({
  visible: z.boolean().default(true),
  order: z.number().int().min(0).max(100),
});

export const storefrontAnnouncementSchema = storefrontSectionBase.extend({
  type: z.literal("announcement"),
  message: z.string().min(1).max(300),
  href: z.string().url().max(2000).optional(),
});

export const storefrontHeroSectionSchema = storefrontSectionBase.extend({
  type: z.literal("hero"),
});

export const storefrontProductCarouselSchema = storefrontSectionBase.extend({
  type: z.literal("productCarousel"),
  title: z.string().min(1).max(120),
  query: z.object({
    sort: z.enum(["relevance", "newest", "price_asc", "price_desc"]).optional(),
    categorySlug: z.string().max(120).optional(),
    productIds: z.array(z.string().uuid()).max(24).optional(),
    tryOnOnly: z.boolean().optional(),
  }),
});

export const storefrontCategoryGridSchema = storefrontSectionBase.extend({
  type: z.literal("categoryGrid"),
  categorySlugs: z.array(z.string().max(120)).max(12).optional(),
});

export const storefrontEditorialSchema = storefrontSectionBase.extend({
  type: z.literal("editorial"),
  imageUrl: z.string().url().max(2000),
  headline: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  ctaHref: z.string().max(500).optional(),
  ctaLabel: z.string().max(80).optional(),
});

export const storefrontTryMePromoSchema = storefrontSectionBase.extend({
  type: z.literal("tryMePromo"),
});

export const storefrontNewsletterSchema = storefrontSectionBase.extend({
  type: z.literal("newsletter"),
});

export const storefrontStorySchema = storefrontSectionBase.extend({
  type: z.literal("story"),
});

export const storefrontSectionSchema = z.discriminatedUnion("type", [
  storefrontAnnouncementSchema,
  storefrontHeroSectionSchema,
  storefrontProductCarouselSchema,
  storefrontCategoryGridSchema,
  storefrontEditorialSchema,
  storefrontTryMePromoSchema,
  storefrontNewsletterSchema,
  storefrontStorySchema,
]);

export const storefrontUpdateSchema = z.object({
  hero: storefrontHeroSchema.optional(),
  sections: z.array(storefrontSectionSchema).max(20).optional(),
});

export const settingsCategorySchema = z.enum([
  "general",
  "commerce",
  "branding",
  "storage",
  "system",
]);

export const settingsGeneralPatchSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  timezone: z.string().max(80).optional(),
  currency: z.string().max(10).optional(),
  language: z.string().max(20).optional(),
});

export const settingsCommercePatchSchema = z.object({
  codEnabled: z.boolean().optional(),
  shippingFee: z.number().min(0).max(100_000).optional(),
  freeShippingAbove: z.number().min(0).max(1_000_000).optional(),
});

export const settingsStoragePatchSchema = z.object({
  maxUploadBytes: z.number().int().min(100_000).max(20_000_000).optional(),
});

export const settingsBrandingPatchSchema = z.object({
  hero: storefrontHeroSchema.optional(),
});

export type StorefrontHeroInput = z.infer<typeof storefrontHeroSchema>;
export type StorefrontSectionInput = z.infer<typeof storefrontSectionSchema>;
export type StorefrontUpdateInput = z.infer<typeof storefrontUpdateSchema>;
export type SettingsCategory = z.infer<typeof settingsCategorySchema>;
export type SettingsGeneralPatchInput = z.infer<typeof settingsGeneralPatchSchema>;
export type SettingsCommercePatchInput = z.infer<typeof settingsCommercePatchSchema>;
export type SettingsStoragePatchInput = z.infer<typeof settingsStoragePatchSchema>;
export type SettingsBrandingPatchInput = z.infer<typeof settingsBrandingPatchSchema>;

export type CartItemAddInput = z.infer<typeof cartItemAddSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export type SegmentRules = z.infer<typeof segmentRulesSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type PosWebhookInput = z.infer<typeof posWebhookSchema>;
export type SearchSynonymCreateInput = z.infer<typeof searchSynonymCreateSchema>;

// --- AI Fashion Studio ---

export const aiFashionGenerationTypeSchema = z.enum([
  "PRODUCT_TO_MODEL",
  "VIRTUAL_TRY_ON",
  "MODEL_CREATED",
  "IMAGE_EDIT",
  "IMAGE_TO_VIDEO",
]);

export const aiFashionGenerateSchema = z
  .object({
    productId: z.string().uuid().optional(),
    productImageId: z.string().uuid().optional(),
    inputImageUrl: z.string().url().optional(),
    sourceJobId: z.string().uuid().optional(),
    type: z
      .enum(["PRODUCT_TO_MODEL", "VIRTUAL_TRY_ON", "IMAGE_TO_VIDEO"])
      .default("PRODUCT_TO_MODEL"),
    modelId: z.string().uuid().optional().nullable(),
    personImageUrl: z.string().url().optional(),
    gender: z.enum(["male", "female", "unisex"]).optional(),
    pose: z.enum(["standing", "casual", "fashion", "custom"]).optional(),
    background: z.enum(["studio", "white", "outdoor", "custom"]).optional(),
    customPrompt: z.string().max(1000).optional(),
    numImages: z.number().int().min(1).max(4).optional(),
    resolution: z.enum(["1k", "2k", "4k"]).optional(),
    generationMode: z.enum(["fast", "balanced", "quality"]).optional(),
    duration: z.union([z.literal(5), z.literal(10)]).optional(),
    videoResolution: z.enum(["480p", "720p", "1080p"]).optional(),
    endImageUrl: z.string().url().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "IMAGE_TO_VIDEO") {
      if (!val.sourceJobId && !val.productId && !val.inputImageUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "IMAGE_TO_VIDEO requires sourceJobId, productId, or inputImageUrl",
          path: ["sourceJobId"],
        });
      }
      return;
    }
    if (!val.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "productId is required",
        path: ["productId"],
      });
    }
  });

export const aiFashionApproveSchema = z.object({
  as: z.enum(["primary", "gallery"]),
});

export const aiFashionModelCreateSchema = z.object({
  name: z.string().min(1).max(120),
  gender: z.enum(["male", "female", "unisex"]),
  ageRange: z.string().max(40).optional().nullable(),
  style: z.string().max(80).optional().nullable(),
  bodyType: z.string().max(80).optional().nullable(),
  skinTone: z.string().max(80).optional().nullable(),
  hairStyle: z.string().max(80).optional().nullable(),
  imageUrl: z.string().url(),
  provider: z.string().max(40).optional(),
  providerModelId: z.string().max(120).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const aiFashionModelUpdateSchema = aiFashionModelCreateSchema.partial();

export const aiFashionModelGenerateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  gender: z.enum(["male", "female", "unisex"]),
  ageRange: z.string().max(40).optional(),
  style: z.string().max(80).optional(),
  bodyType: z.string().max(80).optional(),
  skinTone: z.string().max(80).optional(),
  hairStyle: z.string().max(80).optional(),
  saveToLibrary: z.boolean().optional(),
  numImages: z.number().int().min(1).max(4).optional(),
  resolution: z.enum(["1k", "2k", "4k"]).optional(),
  generationMode: z.enum(["fast", "balanced", "quality"]).optional(),
});

export const aiFashionSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  defaultNumImages: z.number().int().min(1).max(4).optional(),
  defaultModelId: z.string().uuid().nullable().optional(),
  autoGenerateOnCreate: z.boolean().optional(),
  dailyLimit: z.number().int().min(0).max(10000).optional(),
  monthlyLimit: z.number().int().min(0).max(100000).optional(),
  defaultResolution: z.enum(["1k", "2k", "4k"]).optional(),
  defaultGenerationMode: z.enum(["fast", "balanced", "quality"]).optional(),
  maintenanceMode: z.boolean().optional(),
  productToModelEnabled: z.boolean().optional(),
  virtualTryOnEnabled: z.boolean().optional(),
  modelCreationEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  maxImagesPerJob: z.number().int().min(1).max(4).optional(),
  maxConcurrentJobs: z.number().int().min(1).max(50).optional(),
});

export const aiFashionJobsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  type: aiFashionGenerationTypeSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type AiFashionGenerateInput = z.infer<typeof aiFashionGenerateSchema>;
export type AiFashionApproveInput = z.infer<typeof aiFashionApproveSchema>;
export type AiFashionModelCreateInput = z.infer<typeof aiFashionModelCreateSchema>;
export type AiFashionModelUpdateInput = z.infer<typeof aiFashionModelUpdateSchema>;
export type AiFashionModelGenerateInput = z.infer<typeof aiFashionModelGenerateSchema>;
export type AiFashionSettingsUpdateInput = z.infer<typeof aiFashionSettingsUpdateSchema>;
export type AiFashionJobsQuery = z.infer<typeof aiFashionJobsQuerySchema>;

export const tryOnCreateSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  inputImageUrl: z.string().url(),
  inputPublicId: z.string().max(200).optional().nullable(),
  savePhotoConsent: z.boolean().optional(),
});

export const tryOnSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  maxImageBytes: z.number().int().min(100_000).max(20_000_000).optional(),
  retentionHours: z.number().int().min(1).max(24 * 30).optional(),
  perUserPerHour: z.number().int().min(1).max(100).optional(),
  maxConcurrentPerUser: z.number().int().min(1).max(10).optional(),
  consentRequired: z.boolean().optional(),
  allowCamera: z.boolean().optional(),
  allowUpload: z.boolean().optional(),
});

export const tryOnHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export type TryOnCreateInput = z.infer<typeof tryOnCreateSchema>;
export type TryOnHistoryQuery = z.infer<typeof tryOnHistoryQuerySchema>;
export type TryOnSettingsUpdateInput = z.infer<typeof tryOnSettingsUpdateSchema>;
