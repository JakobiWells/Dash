---
title: Google Drive
description: Access and manage your Google Drive files directly from your dashboard.
toolId: google-drive
icon: 📁
tags: [files, productivity, google]
---

# Google Drive

Browse, open, and manage your Google Drive files without leaving your dashboard.

## Getting Started

Sign in with your Google account to access your Drive. Your files and folders appear in a familiar file browser layout.

## Features

- **Browse** — Navigate folders and see all your files
- **Open** — Click any file to open it in Google's editor (Docs, Sheets, Slides, etc.)
- **Recent** — Quick access to recently opened files
- **Search** — Find files by name across your entire Drive
- **Upload** — Drag files from your desktop to upload

## File Types

Google Drive shows all file types including:
- Google Docs, Sheets, Slides, Forms
- PDFs, images, videos
- Any uploaded file

## Tips

- Right-click files for more options: rename, move, download, share.
- Keep this card on your dashboard for a persistent file browser alongside your other tools.
- Pair with the **PDF Merger** or **PDF Splitter** tools — open a PDF from Drive, modify it, then re-upload.
- Drive respects your existing sharing permissions — files you don't own appear as shared.

## How It Works

Google Drive stores files in two ways:
- **Blob storage**: regular files (PDFs, images, videos) are stored as-is in Google's distributed object store
- **Google Workspace formats** (Docs, Sheets, Slides): stored as operational transformation logs rather than static files — every edit is a delta operation that gets applied on top of the previous state, enabling real-time collaboration without conflicts

**File access** works through OAuth 2.0: you grant the app permission to access your files, and Google returns a short-lived access token. The token is never stored permanently — it refreshes automatically.

**Google's storage infrastructure** uses **Colossus** (distributed filesystem) and **Bigtable** (distributed key-value store) at massive scale. Files are replicated across multiple data centers for durability.

## What Powers This

This tool uses the **Google Drive API v3** and **Google Picker API** for file browsing. Authentication uses **Google OAuth 2.0**. File editing opens in Google's own editors (Docs, Sheets, Slides) in a new tab — the Drive panel provides access and navigation only.
