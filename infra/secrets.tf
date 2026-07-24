locals {
  secret_ids = [
    "truthguard-gemini-api-key",
    "truthguard-factcheck-api-key",
  ]
}

# Manages the secret *containers* only — never a value. Real key values
# are set via `gcloud secrets versions add` or the console, by hand,
# and never enter Terraform state or this repo.
resource "google_secret_manager_secret" "keys" {
  for_each = toset(local.secret_ids)

  secret_id = each.value
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "build_sa_access" {
  for_each = toset(local.secret_ids)

  secret_id = google_secret_manager_secret.keys[each.value].secret_id
  project   = var.project_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${local.build_service_account}"
}
