---
title: Medirecords Backend
emoji: 🏥
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

FastAPI backend for Medirecords. Runs as a Docker container; see `Dockerfile`.

Required environment variables (set as Space secrets under Settings → Variables and secrets):

- `DATABASE_URL`
- `SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `FRONTEND_URL`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` (paste the full service account JSON; only needed if using Vision OCR)
- Optional: `GROQ_API_KEY`, `GOOGLE_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`