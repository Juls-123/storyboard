# Deployment Instructions

This application is configured as a **Unified Monorepo**. The Node.js backend serves the React frontend build.

## Prerequisites
- Docker (optional but recommended)
- Node.js 20+

## Option 1: Docker (Recommended)
This approach works on Railway, Render, DigitalOcean, etc.

1.  **Build the Image**:
    ```bash
    docker build -t storyboard .
    ```

2.  **Run the Container**:
    ```bash
    docker run -p 3001:3001 -e JWT_SECRET=your_secret_key storyboard
    ```

3.  **Access**:
    Open http://localhost:3001

## Option 2: Manual Build
1.  **Build Frontend**:
    ```bash
    npm install
    npm run build
    ```

2.  **Run Backend**:
    ```bash
    cd server
    npm install
    npx tsc  # Compile TypeScript
    NODE_ENV=production node dist/index.js
    ```

## Environment Variables
- `PORT`: (Default: 3001)
- `JWT_SECRET`: Secret for auth tokens.
- `DATABASE_URL`: (Default: `file:./forensics.db`). For production, ensure the database file is persisted (Docker Volume).

## Render.com Specifics (Critical)
To prevent data loss on restarts/redeploys:
1.  **Add a Disk**: In your Render Service settings, go to "Disks".
2.  **Mount Path**: Set the mount path to `/app/data`.
3.  **Size**: 1GB is sufficient.
4.  **Environment Variable**: Set `DATABASE_URL` to `file:/app/data/forensics.db`.

*Note: If you used the `render.yaml` Blueprint, this should be configured automatically.*
