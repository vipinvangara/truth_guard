# Infrastructure

Terraform for the GCP resources backing `backend/`'s Cloud Run
deployment: enabled APIs, the Cloud Build service account's IAM roles,
the two Secret Manager secret *containers* (never their values), and the
Cloud Run service's shape (scaling, resources, secret wiring).

**What this does NOT manage**: secret values (set by hand — see
`backend/README.md`'s Secrets section) and code deploys (still
`gcloud run deploy --source .` — this repo builds via Cloud Build, not
Terraform; the Cloud Run resource here ignores the `image` field so the
two don't fight each other).

## Setup

```bash
cd infra
terraform init
```

## Adopting existing resources (one-time)

Everything this config describes was created manually before this config
existed — `terraform apply` on a fresh state would try to create
duplicates and fail. Import the real resources into state first:

```bash
terraform import 'google_project_service.apis["run.googleapis.com"]' thefirstprojectvv/run.googleapis.com
terraform import 'google_project_service.apis["cloudbuild.googleapis.com"]' thefirstprojectvv/cloudbuild.googleapis.com
terraform import 'google_project_service.apis["artifactregistry.googleapis.com"]' thefirstprojectvv/artifactregistry.googleapis.com
terraform import 'google_project_service.apis["containerregistry.googleapis.com"]' thefirstprojectvv/containerregistry.googleapis.com
terraform import 'google_project_service.apis["secretmanager.googleapis.com"]' thefirstprojectvv/secretmanager.googleapis.com

terraform import 'google_project_iam_member.build_sa_roles["roles/storage.objectViewer"]' "thefirstprojectvv roles/storage.objectViewer serviceAccount:648011521289-compute@developer.gserviceaccount.com"
terraform import 'google_project_iam_member.build_sa_roles["roles/logging.logWriter"]' "thefirstprojectvv roles/logging.logWriter serviceAccount:648011521289-compute@developer.gserviceaccount.com"
terraform import 'google_project_iam_member.build_sa_roles["roles/artifactregistry.writer"]' "thefirstprojectvv roles/artifactregistry.writer serviceAccount:648011521289-compute@developer.gserviceaccount.com"

terraform import 'google_secret_manager_secret.keys["truthguard-gemini-api-key"]' projects/thefirstprojectvv/secrets/truthguard-gemini-api-key
terraform import 'google_secret_manager_secret.keys["truthguard-factcheck-api-key"]' projects/thefirstprojectvv/secrets/truthguard-factcheck-api-key

terraform import 'google_secret_manager_secret_iam_member.build_sa_access["truthguard-gemini-api-key"]' "projects/thefirstprojectvv/secrets/truthguard-gemini-api-key roles/secretmanager.secretAccessor serviceAccount:648011521289-compute@developer.gserviceaccount.com"
terraform import 'google_secret_manager_secret_iam_member.build_sa_access["truthguard-factcheck-api-key"]' "projects/thefirstprojectvv/secrets/truthguard-factcheck-api-key roles/secretmanager.secretAccessor serviceAccount:648011521289-compute@developer.gserviceaccount.com"

terraform import google_cloud_run_v2_service.verify projects/thefirstprojectvv/locations/us-central1/services/truthguard-verify
terraform import google_cloud_run_v2_service_iam_member.public_access "projects/thefirstprojectvv/locations/us-central1/services/truthguard-verify roles/run.invoker allUsers"
```

After importing, run `terraform plan` — it should show **no changes**
(or only the `image` field, which is expected and ignored on apply). If
it shows anything else, stop and reconcile the `.tf` files against
reality before running `apply` — don't let `apply` "fix" real
infrastructure to match a config that might just be wrong.

## Day-to-day

- Changing scaling limits, memory, IAM, or adding a new secret: edit the
  relevant `.tf` file, `terraform plan`, review the diff, `terraform apply`.
- Deploying new backend code: still `gcloud run deploy --source .` from
  `backend/` — unrelated to this config.
- Rotating a secret value: still `gcloud secrets versions add` or the
  console — unrelated to this config.

## State

State is local (`terraform.tfstate`, gitignored) — fine for a single
operator. If this project gets more than one person running `terraform
apply`, move to a remote backend (a GCS bucket) before that causes state
conflicts — not set up yet since it's premature for one person.
