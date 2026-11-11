import type { ComponentType } from "react"

import { AiAssistant } from "./ai/ai-assistant"
import { SignIn } from "./auth/sign-in"
import { SignUpSplit } from "./auth/sign-up-split"
import { CtaBanner } from "./cta/cta-banner"
import { CtaCentered } from "./cta/cta-centered"
import { CtaSignup } from "./cta/cta-signup"
import { OnboardingChecklist } from "./dashboard/onboarding-checklist"
import { OrdersTable } from "./dashboard/orders-table"
import { RevenueChart } from "./dashboard/revenue-chart"
import { StatsCards } from "./dashboard/stats-cards"
import { NotFound } from "./errors/not-found"
import { FaqGrid } from "./faq/faq-grid"
import { FaqSplit } from "./faq/faq-split"
import { FeaturesBento } from "./features/features-bento"
import { FeaturesGrid } from "./features/features-grid"
import { ColumnsFooter } from "./footers/columns-footer"
import { CtaFooter } from "./footers/cta-footer"
import { SimpleFooter } from "./footers/simple-footer"
import { DashboardHeader } from "./headers/dashboard-header"
import { PillHeader } from "./headers/pill-header"
import { ReportHeader } from "./headers/report-header"
import { WebsiteHeader } from "./headers/website-header"
import { WorkspaceHeader } from "./headers/workspace-header"
import { HeroCentered } from "./heroes/hero-centered"
import { HeroSignup } from "./heroes/hero-signup"
import { HeroSplit } from "./heroes/hero-split"
import { HeroStats } from "./heroes/hero-stats"
import { PricingComparison } from "./pricing/pricing-comparison"
import { PricingTiers } from "./pricing/pricing-tiers"
import { DashboardSidebar } from "./sidebars/dashboard-sidebar"
import { SettingsSidebar } from "./sidebars/settings-sidebar"
import { ProfileSettings } from "./settings/profile-settings"
import { WorkspaceSidebar } from "./sidebars/workspace-sidebar"
import { TestimonialFeatured } from "./testimonials/testimonial-featured"
import { TestimonialsGrid } from "./testimonials/testimonials-grid"

// The free blocks, by slug (apps/web lib/docs/blocks.ts), one folder per category. This file and the blocks it lists are
// the same in the free repository (MIT) and in Dashral Pro: a free block starts there.
export const freeBlockComponents: Record<string, ComponentType> = {
  "ai-assistant": AiAssistant,
  "dashboard-header": DashboardHeader,
  "workspace-header": WorkspaceHeader,
  "report-header": ReportHeader,
  "website-header": WebsiteHeader,
  "pill-header": PillHeader,
  "hero-centered": HeroCentered,
  "hero-split": HeroSplit,
  "hero-signup": HeroSignup,
  "hero-stats": HeroStats,
  "dashboard-sidebar": DashboardSidebar,
  "workspace-sidebar": WorkspaceSidebar,
  "settings-sidebar": SettingsSidebar,
  "stats-cards": StatsCards,
  "revenue-chart": RevenueChart,
  "orders-table": OrdersTable,
  "onboarding-checklist": OnboardingChecklist,
  "cta-banner": CtaBanner,
  "cta-centered": CtaCentered,
  "cta-signup": CtaSignup,
  "not-found": NotFound,
  "simple-footer": SimpleFooter,
  "columns-footer": ColumnsFooter,
  "cta-footer": CtaFooter,
  "features-grid": FeaturesGrid,
  "features-bento": FeaturesBento,
  "pricing-tiers": PricingTiers,
  "pricing-comparison": PricingComparison,
  "testimonials-grid": TestimonialsGrid,
  "testimonial-featured": TestimonialFeatured,
  "faq-split": FaqSplit,
  "faq-grid": FaqGrid,
  "sign-in": SignIn,
  "sign-up-split": SignUpSplit,
  "profile-settings": ProfileSettings,
}
