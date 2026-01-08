# 🔖 AiPrivaMark

<p align="center">
  <!-- 可以在这里放你的 Logo 图片 -->
  <!-- <img src="./assets/icon.png" width="128" height="128" /> -->
</p>

<p align="center">
  <strong>Your Private, AI-Powered Knowledge Base.</strong><br>
  <strong>隐私优先的 AI 智能收藏夹</strong>
</p>

<p align="center">
  <a href="#english">English</a> | <a href="#中文">中文</a>
</p>

---

<h2 id="english">🇬🇧 English</h2>

**AiPrivaMark** is a browser extension designed to transform your chaotic bookmarks into an organized, searchable knowledge base without compromising your privacy. 

Unlike other "Read Later" services that upload your browsing history to the cloud, AiPrivaMark operates under a **Local-First** architecture. It leverages Large Language Models (LLM) to analyze, tag, and summarize your bookmarks, but the data never leaves your device (except for the necessary API calls to the AI provider).

### ✨ Key Features

*   **🔒 Privacy First:** All your bookmarks, summaries, and tags are stored locally (using Chrome Storage / IndexedDB). No remote servers, no tracking.
*   **🧠 AI-Powered Analysis:** Automatically generates concise summaries and 5-10 smart tags for any saved URL using AI.
*   **🔑 Bring Your Own Key:** Supports multiple AI providers (DeepSeek, OpenAI, Compatible APIs). You control the cost and the model.
*   **📂 Batch Processing:** One-click import to sync your existing browser bookmarks and batch-process them with AI.
*   **🔎 Smart Search:** A side-panel interface offering full-text search across tags, titles, and AI-generated summaries.
*   **💾 Data Sovereignty:** Full support for exporting your data to JSON/CSV.

### 🛠 Tech Stack

*   **Framework:** [Plasmo](https://docs.plasmo.com/) (The React framework for browser extensions)
*   **UI:** React + Tailwind CSS
*   **State Management:** Storage API / React Hooks
*   **Build Tool:** Parcel / TypeScript

---

<h2 id="中文">🇨🇳 中文</h2>

**AiPrivaMark** 是一款致力于保护隐私的浏览器智能收藏夹插件。它旨在帮助你将杂乱的网页收藏转化为井井有条的知识库。

与传统的“稍后阅读”服务不同，AiPrivaMark 采用 **Local-First (本地优先)** 架构。它利用大语言模型（LLM）的能力来分析网页、自动打标签和生成摘要，但你的所有数据都只会保存在你的本地浏览器中，绝不会上传到开发者的服务器。

### ✨ 核心功能

*   **🔒 极致隐私：** 所有的收藏数据、AI 总结、标签完全存储在本地（Chrome Storage / IndexedDB）。没有云端同步，没有数据泄露风险。
*   **🧠 AI 智能解析：** 自动提取网页正文，调用 AI 生成精炼的摘要总结以及 5-10 个精准标签。
*   **🔑 自定义 API：** 支持配置你自己的 API Key（支持 DeepSeek、ChatGPT 及其他 OpenAI 兼容接口），按需使用，成本可控。
*   **📂 批量整理：** 支持一键读取浏览器原生收藏夹，建立任务队列，批量进行 AI 分析与归档。
*   **🔎 侧边栏助手：** 提供常驻侧边栏（Side Panel），支持通过标签、标题和 AI 摘要进行快速检索。
*   **💾 数据自主：** 支持将所有数据导出为 JSON 备份，你的数据完全属于你。

### 🛠 技术栈

*   **框架:** [Plasmo](https://docs.plasmo.com/) (浏览器插件开发领域的 Next.js)
*   **界面:** React + Tailwind CSS
*   **语言:** TypeScript
*   **构建:** Manifest V3 标准

