variable "db_user" {
  description = "The username for the database"
  type        = string
}

variable "db_password" {
  description = "The password for the database"
  type        = string
}

variable "db_name" {
  description = "The name of the database"
  type        = string
}

variable "db_endpoint" {
  description = "The endpoint of the database (excluding port)"
  type        = string
}

variable "db_port" {
  description = "The port of the database"
  type        = string
}

variable "db_params" {
  description = "Search params to append to db connection url"
  type        = string
}

env {
  url = "postgres://${var.db_user}:${var.db_password}@${var.db_endpoint}:${var.db_port}/${var.db_name}?${var.db_params} 
}