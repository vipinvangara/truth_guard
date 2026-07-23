# TruthGuard Verify API

FastAPI service implementing the evidence + judgment side of the pipeline
(docs/ARCHITECTURE.md §5–6): claim extraction and judgment via Gemini,
evidence from Google Fact Check Tools and Wikipedia, a mechanical grounding
gate, claim-hash caching, and per-device rate limiting.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows (source .venv/bin/activate elsewhere)
pip install -r requirements-dev.txt

set TRUTHGUARD_GEMINI_API_KEY=...      # optional but needed for real verdicts
set TRUTHGUARD_FACTCHECK_API_KEY=...   # optional

uvicorn app.main:app --port 8000
```

Without keys the service still runs: Wikipedia evidence is returned and every
verdict is honestly `UNVERIFIED` with `limited: true` — it never fakes a
judgment.

## API

`POST /v1/verify` — header `X-Device-Token: <any stable per-install id>`

```json
{ "text": "Fwd: RBI says all 500 notes invalid from Monday!!" }
```

Response: claims with `verdict` (TRUE/FALSE/MISLEADING/UNVERIFIED/OPINION),
`confidence`, `reasoning`, and cited `evidence` — every evidence item is
guaranteed to come from a real provider response (the grounding gate drops
anything the LLM hallucinates).

`GET /health` — provider availability.

## Tests

```bash
pytest
```

All external HTTP is mocked (respx); tests run offline and free.

## Keys

- Gemini: https://aistudio.google.com/apikey (free tier)
- Fact Check Tools: Google Cloud Console → enable "Fact Check Tools API" → API key (free)

Keys are read from env (`TRUTHGUARD_*`) and sent via `X-Goog-Api-Key` headers,
never URL query strings.
