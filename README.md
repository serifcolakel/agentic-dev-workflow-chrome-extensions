# 🚀 agentic-dev-workflow-chrome-extensions

Chrome extensions built for developers who code with AI agents —  
and want to intentionally use their “agent waiting time” differently.

Agentic development is not constant typing.  
It’s asynchronous.

Prompt → Wait → Review → Refine.

This repository explores how to design that waiting time better.

---

## 🧠 Concept

When working with AI agents:

- You send a prompt
- The agent processes
- You wait
- You review and iterate

Those waiting moments create micro-gaps in attention.

Instead of uncontrolled distraction, this project experiments with:

- Intentional context switching
- Controlled micro-entertainment
- Fast return-to-focus mechanisms
- Async-friendly developer workflows

Yes — this may include things like watching YouTube Shorts during processing time.

But intentionally.

---

## 🎯 Philosophy

Agentic coding changes how we work:

- Less constant typing
- More thinking and reviewing
- More idle compute moments

The goal is not distraction.

The goal is:

- Managing idle cognitive cycles
- Reducing frustration during AI latency
- Maintaining flow without burnout

Used poorly → procrastination  
Used intentionally → sustainable workflow

---

## ✨ Extensions

### 🧭 AtlasTrace Recorder

Records browser sessions with action + network correlation and exports Markdown traces for agent replay.

### 🎬 Micro-Entertainment Panel

Quick-access short-form content while AI agents process requests.

### ⏱ Agent Activity Indicator

Visual indicator showing when the AI task is running.

### 🔒 Context Lock

One-click return to your previous development tab and context.

### 🔄 Flow Resume Helper

Reminds you what you were working on before switching context.

---

## 📦 Installation

1. Clone the repository
2. Open Chrome and navigate to:

   chrome://extensions/

3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select the extension folder you want to test

---

## 📁 Structure

```

/agentic-dev-workflow-chrome-extensions
│
├── atlastrace-recorder/
├── micro-entertainment-panel/
├── agent-activity-indicator/
├── context-lock/
├── flow-resume-helper/
├── auto-scroll/
└── README.md

```

Each extension contains:

- manifest.json (Manifest V3)
- background scripts
- content scripts
- optional popup UI

---

## 🛠 Tech Stack

- JavaScript / TypeScript
- Chrome Extensions API (Manifest V3)
- Lightweight UI components
- Optional AI state integrations

---

## 🧪 Experimental Nature

This is an experimental repository exploring:

- Async development behavior
- Dopamine-aware workflows
- AI-latency ergonomics
- Attention management for developers

---

## 🗺 Roadmap

- [ ] Auto-detect AI response completion
- [ ] Smart pause when agent responds
- [ ] Focus mode integration
- [ ] Productivity analytics
- [ ] Chrome Web Store packaging
