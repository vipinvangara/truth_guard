# The Cloud Run *service shape* (scaling limits, resources, secret
# wiring) is managed here. The actual running *code* is deployed
# separately via `gcloud run deploy --source .` (see backend/README.md),
# which builds via Cloud Build and pushes a new image — Terraform never
# builds or pushes container images. The `ignore_changes` block below
# means `terraform apply` won't fight with that: a code deploy changes
# the image, and Terraform leaves it alone.
resource "google_cloud_run_v2_service" "verify" {
  name     = var.service_name
  project  = var.project_id
  location = var.region

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    containers {
      # Placeholder — the real image is whatever the last `gcloud run
      # deploy --source .` pushed. Ignored on apply (see lifecycle block).
      image = "us-central1-docker.pkg.dev/${var.project_id}/cloud-run-source-deploy/${var.service_name}:latest"

      resources {
        limits = {
          memory = "512Mi"
          cpu    = "1"
        }
      }

      env {
        name = "TRUTHGUARD_GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.keys["truthguard-gemini-api-key"].secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "TRUTHGUARD_FACTCHECK_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.keys["truthguard-factcheck-api-key"].secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_secret_manager_secret_iam_member.build_sa_access,
  ]
}

# The app calls this endpoint directly with no GCP-level auth — the
# device-token rate limiter (backend/app/ratelimit.py) is the actual
# access control, matching `--allow-unauthenticated` at deploy time.
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.verify.name
  project  = var.project_id
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
