data "google_project" "this" {
  project_id = var.project_id
}

locals {
  # `gcloud run deploy --source .` builds via Cloud Build, which runs as
  # the default Compute Engine service account unless a custom build SA
  # is configured. This is the account that needed the roles below.
  build_service_account = "${data.google_project.this.number}-compute@developer.gserviceaccount.com"

  build_roles = [
    "roles/storage.objectViewer",     # read the uploaded source archive
    "roles/logging.logWriter",        # write build logs
    "roles/artifactregistry.writer",  # push the built image
  ]
}

resource "google_project_iam_member" "build_sa_roles" {
  for_each = toset(local.build_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${local.build_service_account}"
}
