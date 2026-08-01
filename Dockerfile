FROM node:18-alpine

# Cache bust: 2026-01-18
WORKDIR /app

# Accept build arguments from CapRover / Railway.
#
# Every VITE_* value the app reads MUST appear here — the platform can
# only inject it into the build container via --build-arg, and Vite
# statically inlines each `import.meta.env.VITE_*` reference at build
# time. A var set in the platform's Variables tab but NOT listed here
# is invisible to `pnpm run build` and gets baked in as `undefined`.
ARG CAPROVER_GIT_COMMIT_SHA
ARG VITE_AGENT_URL
ARG VITE_APP_BURNER_PRIVATE_KEY
ARG VITE_APP_ENV
ARG VITE_PROD_BROWSER_MODE
ARG VITE_SDK_API_KEY
ARG VITE_PUSHER_BEAMS_INSTANCE_ID=a99bec59-b4a1-4182-bac9-c44b18e91162
ARG VITE_API_URL=$VITE_API_URL
ARG SMILE_ID_PARTNER_ID=$SMILE_ID_PARTNER_ID
ARG SMILE_ID_ENVIRONMENT=$SMILE_ID_ENVIRONMENT

# Google / Apple OAuth (Web). The client IDs must match the backend's
# GOOGLE_CLIENT_IDS + APPLE_CLIENT_IDS allowlists — otherwise /auth/*
# will reject the resulting id_token even if the button renders.
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APPLE_CLIENT_ID

# v3 non-custodial sandbox flavour. Unset on prod builds; the whole
# passkey enrolment / migrate-to-v3 branch dead-code-eliminates.
#   VITE_NON_CUSTODIAL=true       enables passkey enrol + migrate
#   VITE_RIFT_ENVIRONMENT=sandbox flips the SDK env cascade
#   VITE_RIFT_API_BASE            overrides the SDK's httpClient baseUrl
#   VITE_PASSKEY_RP_ID            WebAuthn RP-ID (eTLD+1 of the app host)
#   VITE_PASSKEY_RP_NAME          Label shown in the biometric prompt
ARG VITE_NON_CUSTODIAL
ARG VITE_RIFT_ENVIRONMENT
ARG VITE_RIFT_API_BASE
ARG VITE_PASSKEY_RP_ID
ARG VITE_PASSKEY_RP_NAME

# Third-party integrations. Kept optional because prod defaults exist
# in constants.ts / the respective feature files.
ARG VITE_ENSO_API_KEY
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST
ARG VITE_PRIVACY_POLICY_URL
ARG VITE_APP_LOGO_URL

# Convert build args to environment variables for the build process
ENV CAPROVER_GIT_COMMIT_SHA=$CAPROVER_GIT_COMMIT_SHA
ENV VITE_AGENT_URL=$VITE_AGENT_URL
ENV VITE_APP_BURNER_PRIVATE_KEY=$VITE_APP_BURNER_PRIVATE_KEY

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_PROD_BROWSER_MODE=$VITE_PROD_BROWSER_MODE
ENV VITE_SDK_API_KEY=$VITE_SDK_API_KEY
ENV VITE_PUSHER_BEAMS_INSTANCE_ID=$VITE_PUSHER_BEAMS_INSTANCE_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SMILE_ID_ENV=$VITE_SMILE_ID_ENV

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=$VITE_APPLE_CLIENT_ID

ENV VITE_NON_CUSTODIAL=$VITE_NON_CUSTODIAL
ENV VITE_RIFT_ENVIRONMENT=$VITE_RIFT_ENVIRONMENT
ENV VITE_RIFT_API_BASE=$VITE_RIFT_API_BASE
ENV VITE_PASSKEY_RP_ID=$VITE_PASSKEY_RP_ID
ENV VITE_PASSKEY_RP_NAME=$VITE_PASSKEY_RP_NAME

ENV VITE_ENSO_API_KEY=$VITE_ENSO_API_KEY
ENV VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY
ENV VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST
ENV VITE_PRIVACY_POLICY_URL=$VITE_PRIVACY_POLICY_URL
ENV VITE_APP_LOGO_URL=$VITE_APP_LOGO_URL



# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Copy serve.json to dist folder for proper header configuration
RUN cp serve.json dist/serve.json

RUN npm install -g serve

EXPOSE 8088

# Change to dist directory and serve from there
# The -s flag enables SPA mode (all unknown routes fallback to index.html)
WORKDIR /app/dist
CMD ["serve", "-s", ".", "-l", "8088"]