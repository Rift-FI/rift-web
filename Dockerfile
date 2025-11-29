FROM node:18-alpine

WORKDIR /app

# Accept build arguments from CapRover
ARG CAPROVER_GIT_COMMIT_SHA
ARG VITE_AGENT_URL
ARG VITE_APP_BURNER_PRIVATE_KEY
ARG VITE_APP_ENV
ARG VITE_PROD_BROWSER_MODE
ARG VITE_SDK_API_KEY
ARG VITE_PUSHER_BEAMS_INSTANCE_ID

# Convert build args to environment variables for the build process
ENV CAPROVER_GIT_COMMIT_SHA=$CAPROVER_GIT_COMMIT_SHA
ENV VITE_AGENT_URL=$VITE_AGENT_URL
ENV VITE_APP_BURNER_PRIVATE_KEY=$VITE_APP_BURNER_PRIVATE_KEY
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_PROD_BROWSER_MODE=$VITE_PROD_BROWSER_MODE
ENV VITE_SDK_API_KEY=$VITE_SDK_API_KEY
ENV VITE_PUSHER_BEAMS_INSTANCE_ID=$VITE_PUSHER_BEAMS_INSTANCE_ID

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

# Just specify the port; serve will bind to 0.0.0.0 automatically in Docker
CMD ["serve", "-s", "dist", "-l", "8088"]