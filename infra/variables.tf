variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "thefirstprojectvv"
}

variable "region" {
  description = "Cloud Run region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "truthguard-verify"
}
