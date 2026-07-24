locals {
  enabled_apis = [
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.enabled_apis)

  project = var.project_id
  service = each.value

  # Never let `terraform destroy` disable an API project-wide — other
  # things on this project may depend on it beyond what's defined here.
  disable_on_destroy = false
}
