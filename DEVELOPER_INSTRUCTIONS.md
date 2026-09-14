# AI Agent Working Instructions & Project Standards

## Project Overview & Branding
- **Official Name**: Stem Vault (refer to as "the Stem Vault" in prose/context).
- **Purpose**: A community worship multitrack stem archive and mix challenge platform.

---

## Git & Deployment Branching Workflow

### 1. Default Development Branch (`beta`)
- **Primary Working Branch**: All AI agents must work on, commit to, and push changes to the `beta` branch.
- **Auto-Push Policy**: As soon as a feature, bugfix, or design change is created and verified, automatically commit and push to `origin/beta`.
- **Public Beta Preview Site**: Pushing to `beta` automatically triggers a public Vercel Preview deployment (e.g., `https://stem-vault-beta.vercel.app` or `https://beta.stem-vault-tau.vercel.app`).

### 2. Main Production Branch (`main`)
- **Live Site**: The `main` branch powers the live production deployment.
- **Promotion to Production**: Code on `beta` is merged into `main` ONLY when explicitly requested by the user or when a beta update is approved for release.
- **Merge Command**:
  ```bash
  git checkout main
  git merge beta
  git push origin main
  git checkout beta
  ```

---

## Environment & Build Safeguards
- **Resend & Third-Party APIs**: Provide safe string fallbacks for environment variables (e.g. `process.env.RESEND_API_KEY || 'dummy_key_for_build'`) so Next.js static page evaluation does not crash during Vercel builds when keys are missing.
- **Client vs Server Components**: Ensure interactive browser hooks (`useAuth`, `useToast`, `getSupabaseBrowserClient`) stay inside Client Components (`'use client'`) to prevent server Digest errors (e.g. error `2047099050`).

---

## Key UI & Feature Standards
- **Track of the Week**: Single active stem tagged with `'track of the week'` in Supabase. Admin server actions in `src/app/actions/stems.ts` revalidate `/`, `/stems/[id]`, and `/showcase`.
- **Track of the Week Showcase (`/showcase`)**: Dedicated strictly to the active Track of the Week banner, iTunes-fetched album artwork, and community-submitted mixes styled identically to main page `StemCard` grid items.
