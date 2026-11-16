# Māori text-to-speech: provider research (2026-11-17)

Goal: audio from recognised AI speech models that support te reo Māori, with learners able to switch between models.

| Provider / model | Māori? | Status for 2nd Voice |
|---|---|---|
| **ElevenLabs `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`** | Listed as "Māori (mi)" on the models page | ✅ **Implemented** (v4 + v3). Needs an API key + voice id. Check the plan's commercial-use terms before launch |
| ElevenLabs `eleven_multilingual_v2`, `eleven_flash_v2_5` | Not listed | ❌ |
| **Papa Reo** (Te Hiku Media) Reo Speech Synthesis API | Built for te reo Māori and NZ English | ⏳ Strongest cultural fit and likely the best pronunciation. Access is granted case by case under the **Kaitiakitanga License**, for uses aligned with tikanga Māori. Restrictions include no building of language corpora, and third parties may not gain rights to the outputs. **Apply for access**, and confirm that caching generated audio is allowed |
| OpenAI `gpt-4o-mini-tts`, `tts-1(-hd)` | "Maori" listed (follows Whisper), voices "optimized for English" | ❌ Deprecated: **shuts down 2027-01-06**. Its replacement isn't available on the speech endpoint |
| Google Gemini TTS (`gemini-3.8-flash-tts` etc.) | Not in the language table | ❌ |
| Microsoft Azure Speech | No `mi-NZ` text-to-speech or speech-to-text locale | ❌ |
| Meta MMS-TTS | No public `mms-tts-mri` checkpoint found; the family is CC-BY-NC (non-commercial) anyway | ❌ |

**Important:** "language supported" ≠ "good Māori pronunciation". Every model must be checked by a fluent speaker (vowel length/macrons, `wh`, `ng`, rhythm) before learners rely on it. The UI labels all audio "AI-generated · may contain errors".

## Sources
- ElevenLabs models: https://elevenlabs.io/docs/overview/models
- ElevenLabs TTS API: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- OpenAI TTS: https://developers.openai.com/api/docs/guides/text-to-speech
- Gemini TTS: https://aistudio.google.com/docs/speech-generation
- Azure language support: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
- Papa Reo products: https://papareo.io/products · licence: https://papareo.io/kaitiakitanga
