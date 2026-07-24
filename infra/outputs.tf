output "service_url" {
  description = "The deployed Cloud Run service URL"
  value       = google_cloud_run_v2_service.verify.uri
}
