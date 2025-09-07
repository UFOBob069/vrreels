# Cloud Tasks Queue for VR Reels Builder
# This is a placeholder - you can use this as a starting point for Terraform

resource "google_cloud_tasks_queue" "render_queue" {
  name     = "render-queue"
  location = "us-central1"

  rate_limits {
    max_dispatches_per_second = 10
    max_burst_size           = 100
    max_concurrent_dispatches = 10
  }

  retry_config {
    max_attempts       = 3
    max_retry_duration = "4s"
    max_backoff        = "3s"
    min_backoff        = "0.1s"
    max_doublings      = 16
  }
}

# Service account for Cloud Tasks invoker
resource "google_service_account" "tasks_invoker" {
  account_id   = "tasks-invoker"
  display_name = "Cloud Tasks Invoker"
  description  = "Service account for Cloud Tasks to invoke Cloud Run"
}

# IAM binding for Cloud Tasks to invoke Cloud Run
resource "google_cloud_run_service_iam_member" "tasks_invoker" {
  location = google_cloud_run_service.renderer.location
  service  = google_cloud_run_service.renderer.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.tasks_invoker.email}"
}

# Cloud Run service for renderer
resource "google_cloud_run_service" "renderer" {
  name     = "vr-reels-renderer"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/vr-reels-renderer:latest"
        
        env {
          name  = "GCLOUD_PROJECT"
          value = var.project_id
        }
        
        env {
          name  = "FIREBASE_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "FIREBASE_STORAGE_BUCKET"
          value = "${var.project_id}.appspot.com"
        }
        
        env {
          name  = "VERTEX_LOCATION"
          value = "us-central1"
        }
        
        env {
          name  = "VERTEX_GEMINI_MODEL"
          value = "gemini-2.0-flash"
        }
        
        env {
          name  = "VERTEX_VEO_MODEL"
          value = "veo-3"
        }
        
        env {
          name  = "TTS_PROVIDER"
          value = "mock"
        }
        
        env {
          name  = "ENABLE_VEO"
          value = "true"
        }
        
        resources {
          limits = {
            cpu    = "2"
            memory = "4Gi"
          }
        }
      }
      
      service_account_name = google_service_account.renderer.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Service account for renderer
resource "google_service_account" "renderer" {
  account_id   = "vr-reels-renderer"
  display_name = "VR Reels Renderer"
  description  = "Service account for Cloud Run renderer service"
}

# IAM bindings for renderer service account
resource "google_project_iam_member" "renderer_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.renderer.email}"
}

resource "google_project_iam_member" "renderer_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.renderer.email}"
}

resource "google_project_iam_member" "renderer_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.renderer.email}"
}

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}
