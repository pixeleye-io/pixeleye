data "external" "DB_USERNAME" {
  program = [
    "printenv",
    "DB_USERNAME"
  ]
}

data "external" "DB_PASSWORD" {
  program = [
    "printenv",
    "DB_PASSWORD"
  ]
}

data "external" "DB_HOST" {
  program = [
    "printenv",
    "DB_HOST"
  ]
}

data "external" "DB_PORT" {
  program = [
    "printenv",
    "DB_PORT"
  ]
}

data "external" "DB_NAME" {
  program = [
    "printenv",
    "DB_NAME"
  ]
}

data "external" "DB_PARAMS" {
  program = [
    "printenv",
    "DB_PARAMS"
  ]
}


env "env_url" {
  url = "postgres://${data.DB_USERNAME}:${data.DB_PASSWORD}@${data.DB_HOST}:${data.DB_PORT}/${data.DB_NAME}?${data.DB_PARAMS}"
}
