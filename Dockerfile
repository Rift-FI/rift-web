FROM node:18-alpine

WORKDIR /app

# Accept build arguments from CapRover
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