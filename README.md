# SkiCycleRun Adventures 🌍

A modern, high-performance blog and travel documentation platform built with Astro, featuring advanced authentication, interactive media galleries, and comprehensive content management.

## ✨ Features

### 🌐 Core Platform

- **Static Site Generation** - Lightning-fast performance with Astro
- **Modern Tech Stack** - React 19, TypeScript, Tailwind CSS v4
- **Responsive Design** - Mobile-first, accessible interface
- **SEO Optimized** - Automated sitemaps, meta tags, and structured data
- **Progressive Enhancement** - Works without JavaScript, enhanced with it

### 🔐 Authentication & Security

- **AWS Cognito Integration** - Secure user authentication with JWT tokens
- **Protected Content** - Role-based access control (GeneralUsers, PowerUsers, SuperUsers)
- **Client-side Auth State** - Seamless login/logout experience
- **Secure Cookies** - HTTPS-only authentication flow

### 📝 Content Management

- **Multi-format Content** - MDX, Markdown, and rich media support
- **Content Types** - Travel, Technology, Programming, General posts
- **Tagging System** - Advanced categorization and filtering
- **Draft System** - Preview content before publishing
- **Scheduled Publishing** - Future-dated content support

### 🎨 Interactive Features

- **Photo Galleries** - Remote photo gallery integration with lazy loading
- **3D Travel Globe** - Interactive globe showing travel destinations with Three.js
- **Video Support** - Embedded video content with custom layouts
- **Theme Switching** - Light/dark mode with system preference detection
- **Advanced Search** - Full-text search with Fuse.js

### 🌍 Travel & Geography

- **Geolocation Support** - Latitude/longitude metadata for posts
- **Travel Documentation** - Specialized layouts for travel content
- **Interactive Maps** - Location visualization and exploration

## 🚀 Project Structure

```text
/
├── public/                    # Static assets
│   ├── images/               # Optimized images
│   ├── videos/               # Video content
│   └── globe/                # 3D globe data
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AuthButton.astro  # Authentication controls
│   │   ├── TravelGlobe.tsx   # Interactive 3D globe
│   │   └── RemotePhotoGallery.tsx # Photo galleries
│   ├── content/              # Content collections
│   │   └── blog/             # Blog posts (MDX/MD)
│   ├── layouts/              # Page layouts
│   │   ├── MDXLayout.astro   # Rich content layout
│   │   └── PhotoLayout.astro # Gallery layouts
│   ├── pages/                # Static routes
│   ├── config/               # Configuration files
│   │   ├── cognito.ts        # AWS Cognito setup
│   │   └── types.ts          # TypeScript definitions
│   └── utils/                # Utility functions
├── scripts/                  # Build and utility scripts
└── astro.config.mjs         # Astro configuration
```

## 🛠️ Tech Stack

- **Framework**: [Astro 5.x](https://astro.build/) - Static site generator
- **Frontend**: [React 19](https://react.dev/) - UI components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS
- **Content**: [MDX](https://mdxjs.com/) - Markdown with JSX components
- **Authentication**: [AWS Cognito](https://aws.amazon.com/cognito/) - User management
- **3D Graphics**: [Three.js](https://threejs.org/) - 3D globe visualization
- **Search**: [Fuse.js](https://fusejs.io/) - Fuzzy search
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- AWS Cognito setup (for authentication features)

### Installation

```bash
# Clone the repository
git clone https://github.com/timothyhalley/skicyclerun.com.git
cd skicyclerun.com

# Install dependencies
npm install

# Copy environment template
cp !env.example .env.development

# Start development server
npm run dev
```

### Environment Setup

Create `.env.development` with your configuration:

```env
# AWS Cognito Configuration
PUBLIC_USER_POOL_ID=your_user_pool_id
PUBLIC_USER_POOL_CLIENT_ID=your_client_id
PUBLIC_AWS_REGION=us-west-2

# API Configuration
PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com

# Site Configuration
SKICYCLERUN_URL=https://localhost:4321
```

## 🧞 Commands

| Command           | Action                                               |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start development server at `https://localhost:4321` |
| `npm run build`   | Build production site to `./dist/`                   |
| `npm run preview` | Preview build locally                                |
| `npm run format`  | Format code with Prettier                            |
| `npm run lint`    | Lint code with ESLint                                |
| `npm run sync`    | Sync Astro content collections                       |

## � Authentication System

This project implements a complete authentication system using AWS Cognito with client-side JWT management.

### Features

- **Hosted UI Integration** - Seamless login/logout flow
- **Role-based Access** - Three user tiers (General, Power, Super Users)
- **Protected Content** - Posts can require authentication and specific user groups
- **JWT Validation** - Client-side token verification and API integration

### Setup

1. **Configure AWS Cognito**:
   - Create User Pool with Hosted UI
   - Set up user groups (GeneralUsers, PowerUsers, SuperUsers)
   - Configure redirect URIs for your domain

2. **API Gateway Setup**:
   - Deploy Lambda functions for protected content
   - Enable CORS for your site origins
   - Use JWT authorizers for protected endpoints

3. **Content Protection**:

   ```yaml
   ---
   title: "Protected Post"
   auth_required: true
   auth_groups: ["PowerUsers", "SuperUsers"]
   ---
   ```

## 🌐 Local HTTPS Development

For secure authentication testing, the project supports local HTTPS development using mkcert.

### Setup HTTPS Certificates

```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install

# Generate localhost certificate
mkcert localhost 127.0.0.1 ::1
```

This creates `localhost+2.pem` and `localhost+2-key.pem` files that are automatically detected by the development server.

## 📝 Content Creation

### Blog Post Structure

```yaml
---
type: "TRAVEL" # TRAVEL, TECH, PROGRAMMING, GENERAL
title: "Your Post Title"
description: "Post description for SEO"
pubDatetime: 2025-01-01T00:00:00Z
author: "Tim H"
tags: ["travel", "adventure"]
featured: true
draft: false

# Optional: Authentication
auth_required: true
auth_groups: ["GeneralUsers"]

# Optional: Geography
lat: 45.5017
lon: -73.5673

# Optional: Media
cover: "/images/cover.jpg"
album: "album-name-for-gallery"
---
Your content here with full MDX support!
```

### Content Types

- **TRAVEL** - Travel experiences, destinations, adventures
- **TECH** - Technology reviews, tutorials, industry insights
- **PROGRAMMING** - Code tutorials, development tips, tools
- **GENERAL** - Personal thoughts, miscellaneous topics

## 🎨 Interactive Components

### Travel Globe

Interactive 3D globe showing travel destinations:

```tsx
<TravelGlobe />
```

### Photo Galleries

Remote photo galleries with lazy loading:

```tsx
<RemotePhotoGallery album="adventure-2024" />
```

### Protected Content

Wrap sensitive content with authentication:

```astro
<ProtectedContentWrapper requiredGroups={["PowerUsers"]}>
  <!-- Protected content here -->
</ProtectedContentWrapper>
```

## 🚢 Deployment

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

### Environment Variables

Production requires these environment variables:

```env
SKICYCLERUN_URL=https://skicyclerun.com
PUBLIC_USER_POOL_ID=your_production_pool_id
PUBLIC_USER_POOL_CLIENT_ID=your_production_client_id
PUBLIC_API_BASE_URL=https://your-production-api.amazonaws.com
```

### AWS CloudFront

Useful CloudFront management commands:

```bash
# List distributions
aws cloudfront list-distributions --output table --query 'DistributionList.Items[*].[Id,Origins.Items[0].DomainName]'

# Create invalidation
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) - see the license for details.

## 🔗 Links

- **Live Site**: [skicyclerun.com](https://skicyclerun.com)
- **Documentation**: [Astro Docs](https://docs.astro.build)
- **Community**: [Astro Discord](https://astro.build/chat)

## 🔍 SEO & Performance

## [![SkiCycleRun Lighthouse Score](src/assets/images/lighthouse-score.png)](https://pagespeed.web.dev/analysis/https-skicyclerun-com/ly6yl3o0pj?form_factor=mobile)

Built with ❤️ by [Tim H](https://github.com/timothyhalley) • Powered by [Astro](https://astro.build)
