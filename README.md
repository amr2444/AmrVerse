# AmrVerse

AmrVerse is my personal attempt to build a manhwa platform that feels more alive than a simple reading site.

I did not want to create just another catalog with a dark background and a list of chapters. The idea behind AmrVerse is to mix reading, creator tools, community energy, and real product ambition in one place. I want the platform to feel like a universe around manhwa, not only a page where you scroll images.

## Why I built it

I wanted a space where:

- readers can discover and follow manhwas in a cleaner and more immersive way
- creators can publish and manage their own content
- approval workflows feel real and structured
- social and live-reading features can make the platform more engaging over time

This project is also a way for me to push myself beyond basic frontend cloning and into building a full product with backend logic, authentication, workflows, monitoring, and evolving architecture.

## Current direction

AmrVerse is being shaped around 4 pillars:

1. Reading experience  
Smooth chapter reading, cleaner navigation, better reader flows, and support for multiple content sources.

2. Creator ecosystem  
Creator requests, approval flow, creator-facing tools, upload flows, and chapter management.

3. Community layer  
Reading rooms, social interactions, profile activity, and features that make the platform feel inhabited.

4. Product quality  
Monitoring, testing, auth hardening, database structure, and better error handling so the app can keep growing without collapsing under new features.

## What is already inside

- authentication with login, signup, refresh flow, and legacy password migration support
- creator request workflow with admin approval and email notifications
- admin creator management pages
- dashboard, profile, library, and reading history features
- local and MangaDex-backed reading flows
- chapter upload and page upload tooling
- reading rooms and real-time oriented foundations
- monitoring and observability foundations
- API tests, integration tests, app tests, and end-to-end test setup

## Stack

- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Resend
- Socket.IO
- Vitest
- Playwright

## Repository structure

The application code lives inside [`amrverse/`](./amrverse).

Main areas:

- `amrverse/app` -> pages, API routes, server actions, reader flows
- `amrverse/components` -> UI and feature components
- `amrverse/lib` -> business logic, services, monitoring, auth, MangaDex integration
- `amrverse/scripts` -> SQL schema and migrations
- `amrverse/tests` -> API, integration, app, and e2e tests

## Run locally

```bash
cd amrverse
npm install
npm run dev
```

If you want the full local environment, check:

- [`amrverse/LOCAL_SETUP.md`](./amrverse/LOCAL_SETUP.md)
- [`amrverse/PRODUCTION_ENV.md`](./amrverse/PRODUCTION_ENV.md)

## What I want to improve next

This project is still evolving, and that is part of the point.

My current priority is to make AmrVerse feel more polished, more coherent, and more addictive in a good way. That means:

- fixing edge cases in chapter routing and reader reliability
- cleaning chapter ordering logic for all reading sources
- improving the visual identity so the platform feels more premium and less generic
- making creator tools stronger and easier to use
- deepening the social side with more meaningful room and community interactions
- pushing performance, monitoring, and overall stability

## Long-term vision

I want AmrVerse to grow into a platform where reading, publishing, and community feel connected.

Not just:

- browse
- click
- read
- leave

But something closer to:

- discover a title
- follow its releases
- interact with the people around it
- join live reading spaces
- watch creators grow on the platform

That is the direction behind the project.

## Status

AmrVerse is an active work in progress, built and iterated by me step by step.

Some parts are already solid, some parts are still being refined, and some ideas are intentionally ambitious because I want this project to become bigger than a simple demo.

## Author

Built by Amr.  
GitHub: [@amr2444](https://github.com/amr2444)
