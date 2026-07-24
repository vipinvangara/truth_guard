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

cp .env.example .env             # then fill in real key values in .env
uvicorn app.main:app --port 8000
```

`.env` is read automatically (`config.py`'s `env_file` setting) and is
gitignored — this is the recommended way to set keys locally, since it
works identically regardless of shell (cmd.exe vs PowerShell env-var syntax
differs and is easy to get subtly wrong — `.env` sidesteps that entirely).

Without keys the service still runs: Wikipedia evidence is returned and every
verdict is honestly `UNVERIFIED` with `limited: true` — it never fakes a
judgment.

<details>
<summary>Alternative: shell env vars instead of .env</summary>

```bash
# cmd.exe:
set TRUTHGUARD_GEMINI_API_KEY=...
set TRUTHGUARD_FACTCHECK_API_KEY=...

# PowerShell (check your prompt: "PS C:\...>" — this is the default on most
# Windows setups; `set`/`%VAR%` are cmd.exe-only and silently no-op here):
$env:TRUTHGUARD_GEMINI_API_KEY = "..."
$env:TRUTHGUARD_FACTCHECK_API_KEY = "..."
```

Real environment variables still take priority over `.env` if both are set
(standard pydantic-settings precedence).
</details>

## Deploy to Cloud Run

Prereqs: [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and
authenticated (`gcloud auth login`), a GCP project selected
(`gcloud config set project YOUR_PROJECT_ID`).

From the `backend/` directory:

```bash
gcloud run deploy truthguard-verify \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1
```

This deploys the service with no keys — see **Secrets** below to wire them up
via Secret Manager rather than plaintext env vars.

`--source .` builds the `Dockerfile` in this directory via Cloud Build —
no manual `docker build`/`push` needed. `--allow-unauthenticated` is
required since the app calls this endpoint directly (the device-token
rate limiter is the access control here, not GCP IAM).

**Why `--max-instances 1`**: the rate limiter (`ratelimit.py`) and cache
(`cache.py`) both hold state in the process — an in-memory dict and a
local SQLite file. Multiple instances would each have their own copy,
silently breaking both (a client could burst past the rate limit by
landing on a fresh instance; cache hit rate would drop). Pinning to at
most one instance keeps behavior identical to local dev and matches the
existing code comment in `config.py` ("Cloud Run single instance is fine
for P1"). It also caps worst-case cost exposure — no autoscale-out means
no runaway parallel-instance billing even under abusive traffic.

**Why `--min-instances 0`**: guarantees zero cost while idle (Cloud Run's
free tier — 2M requests/month, 360k GB-seconds/180k vCPU-seconds compute
— comfortably covers this app's expected volume). Trade-off: a cold
start (a few seconds) on the first request after an idle period. Revisit
to `--min-instances 1` later if that latency becomes a real UX problem —
it's a one-line redeploy, not an architecture change.

For an extra guardrail beyond the instance caps above, set up a
[budget alert](https://cloud.google.com/billing/docs/how-to/budgets) on
the GCP project — it won't stop spend automatically, but Cloud Run has
no hard "spending limit" toggle, so an alert is the standard way to
catch anything unexpected early.

`us-central1` is used here for North America-based testing; switch to
`asia-south1` (Mumbai) or another region once the primary user base and
where the app is actually tested from is settled.

After deploy, `gcloud` prints a **Service URL**
(`https://truthguard-verify-xxxxx.asia-south1.run.app`). Paste that into
`data/verification/build.gradle.kts`'s `release` block, replacing
`"https://not-yet-deployed.invalid/"`.

## Secrets

Keys are stored in [Secret Manager](https://cloud.google.com/secret-manager),
not as plaintext Cloud Run env vars — this keeps them out of `gcloud`
command history and the service's visible config
(`gcloud run services describe`).

One-time setup (already done for the `thefirstprojectvv` project — this is
for setting up a new project from scratch):

```bash
gcloud services enable secretmanager.googleapis.com

gcloud secrets create truthguard-gemini-api-key --replication-policy=automatic
gcloud secrets create truthguard-factcheck-api-key --replication-policy=automatic

# Let Cloud Run's runtime service account read them (scoped to just these
# two secrets, not project-wide access):
gcloud secrets add-iam-policy-binding truthguard-gemini-api-key \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding truthguard-factcheck-api-key \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

To set or rotate a key's actual value (run this yourself — never paste a
real key into a shared chat or commit it anywhere):

```bash
echo -n "your-actual-key" | gcloud secrets versions add truthguard-gemini-api-key --data-file=-
echo -n "your-actual-key" | gcloud secrets versions add truthguard-factcheck-api-key --data-file=-
```

Then point the Cloud Run service at the secrets (this step only
references secret *names*, never a value, so it's safe to run from
anywhere):

```bash
gcloud run services update truthguard-verify \
  --region us-central1 \
  --set-secrets=TRUTHGUARD_GEMINI_API_KEY=truthguard-gemini-api-key:latest,TRUTHGUARD_FACTCHECK_API_KEY=truthguard-factcheck-api-key:latest
```

Rotating a key later is just adding a new secret version (`versions add`
again) — Cloud Run picks up `:latest` on the next revision, no redeploy
of the container itself needed if you re-run the `services update` above
(or set up automatic rollout on new secret versions if that's ever worth
the complexity).

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
