# 开发计划 (Development Plan)

## 1. 多语言支持扩展 (Internationalization)
计划将插件支持的界面语言扩展至 10 种。

### 待支持语言列表 (Planned Languages)
1.  [x] 简体中文 (Simplified Chinese)
2.  [x] 英语 (English)
3.  [ ] 繁体中文 (Traditional Chinese)
4.  [ ] 日语 (Japanese)
5.  [ ] 韩语 (Korean)
6.  [ ] 法语 (French)
7.  [ ] 德语 (German)
8.  [ ] 西班牙语 (Spanish)
9.  [ ] 葡萄牙语 (Portuguese)
10. [ ] 俄语 (Russian)

### 核心功能改进
- **语言感知分析**：AI 在生成书签标签 (Tags) 和总结 (Summary) 时，应自动匹配用户当前设置的插件界面语言。
    - 在 Prompt 中动态注入目标语言指令。
    - 确保跨语言语义搜索的准确性。

## 2. 国际化 AI 模型集成 (AI Model Integration)
为了更好地服务全球用户，计划引入更多国际主流 AI 服务商。

### 待集成模型提供商
- [ ] **Anthropic (Claude)**: 集成 Claude 3.5 Sonnet/Haiku 等模型。
- [ ] **Google (Gemini)**: 支持 Gemini Pro 系列模型。
- [ ] **Groq**: 提供极速的推理体验。
- [ ] **Mistral AI**: 欧洲领先的开源模型提供商。
- [ ] **Azure OpenAI**: 为企业级用户提供更稳定的连接。

## 3. 待办事项清单 (To-Do List)

### 短期目标
- [ ] 重构 `src/services/ai.ts` 以支持更灵活的 Prompt 模板。
- [ ] 更新 `src/i18n` 架构，方便快速添加新语言包。
- [ ] 调研 Anthropic 和 Google Gemini 的 API 文档。

### 中长期目标
- [ ] 建立多语言提示词 (Prompt) 库，针对不同语言优化总结效果。
- [ ] 支持用户自定义分析语言（界面语言与分析输出语言可分离）。
- [ ] 优化国际模型在不同地区的访问稳定性。
