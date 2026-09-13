# PEACEMAGENTS WORLDWIDE — STAGE 1–12

Full project foundation for the PEACEMAGENTS WORLDWIDE digital business system.

## Included
- Customer storefront
- Product catalogue and product detail pages
- Customer account UI
- Internal HQ/admin UI
- Supabase/Postgres schema foundation
- SEO sitemap and robots routes
- Stripe integration placeholders
- Resend integration placeholder
- Environment-variable setup
- Responsive minimalist black/white PM branding

## Local development
npm install
npm run dev

## Deployment
Push this repository to GitHub and import it into Vercel.

Do NOT commit .env or production credentials. Connect PEACEMAGENTS-owned Supabase, Stripe, Resend, domain and other production accounts during the production handover.

This is the Stage 1–12 foundation; authentication/RLS hardening, real cart/checkout, payments, emails, storage, validation, rate limiting, audit logging and production QA are next implementation steps.