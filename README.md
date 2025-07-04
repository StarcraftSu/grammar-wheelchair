# Grammar Wheelchair ♿

A Slack slash command that improves text grammar and clarity using OpenAI GPT.

## Demo

![Screenshot](screenshot.png)

## Overview

This project implements a **Slack Slash Command** called `/revise` that rewrites user-provided text for improved grammar, clarity, and tone using the **OpenAI GPT API**. It is designed as a lightweight webhook-based integration for fast, secure feedback in real-time Slack conversations.

---

## Features

- Accepts any message via `/revise [text]` in Slack.
- Sends message to OpenAI's GPT model for correction.
- Replies directly in Slack with a revised version.
- Can be tested and developed locally using `ngrok`.

**Note:** Ephemeral messages (only visible to you) will be automatically cleared when the app restarts.

---

## Architecture

```text
User (/revise) → Slack API → Webhook (Express.js) → OpenAI GPT API
                                     ↓
                                 Slack Response
