# ADR 0002: Hybrid inference — on-device extraction, cloud reasoning

Date: 2026-07-23 · Status: Accepted

## Context

The original design PDF ("On-Device Multimodal Fact-Checking Architecture",
docs/) envisions a fully on-device pipeline: JNI/NDK, whisper.cpp, AASIST,
Gemini Nano, local vector store. That is months of platform work before any
real verdict ships, and evidence retrieval requires the network anyway.
A fully-cloud design is simplest but sends user media off-device — the worst
privacy posture for an audience checking private family chats.

## Decision

Hybrid: cheap/private steps run on-device (ML Kit OCR, language ID/translate,
EXIF/C2PA parsing, perceptual hashing, Gemini Nano image description where the
device supports it); reasoning and evidence retrieval run server-side behind a
thin backend. Raw media never leaves the device by default — only extracted
claim text, behind explicit user consent.

## Consequences

- Real verdicts ship in P1 instead of after months of native ML work.
- Privacy stance is strong and explainable: "your photo never leaves the phone."
- The `EvidenceProvider` / `JudgmentProvider` / analyzer interfaces are the
  sanctioned seams for moving more inference on-device later (P6+); deeper
  on-device work should extend those, not bypass them.
