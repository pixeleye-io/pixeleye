variable "DB_USERNAME" {
  description = "The username for the database"
  type        = string
}

variable "DB_PASSWORD" {
  description = "The password for the database"
  type        = string
}

variable "DB_NAME" {
  description = "The name of the database"
  type        = string
}

variable "DB_HOST" {
  description = "The endpoint of the database (excluding port)"
  type        = string
}

variable "DB_PORT" {
  description = "The port of the database"
  type        = string
}

variable "DB_PARAMS" {
  description = "Search params to append to db connection url"
  type        = string
}

env {
  url = "postgres://${var.DB_USERNAME}:${var.DB_PASSWORD}@${var.DB_HOST}:${var.DB_PORT}/${var.DB_NAME}?${var.DB_PARAMS} 
}