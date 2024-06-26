schema "public" {}

schema "private" {}

table "users" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }

  column "auth_id" {
    type = varchar(255)
    null = false
  }

  column "created_at" {
    type = timestamptz
    null = false
  }
  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "avatar_url" {
    type = text
    null = false
  }

  index "idx_unique_user_auth_id" {
    columns = [column.auth_id]
    unique  = true
  }

  index "idx_unique_user_email" {
    columns = [column.email]
    unique  = true
  }
}

enum "account_provider" {
  schema = schema.public
  values = ["github", "gitlab", "bitbucket"]
}

table "account" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "user_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "user_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "provider" {
    type = enum.account_provider
    null = false
  }

  column "provider_account_id" {
    type = varchar(255)
    null = false
  }

  column "refresh_token" {
    type = varchar(255)
    null = false
  }

  column "access_token" {
    type = varchar(255)
    null = false
  }

  column "access_token_expires_at" {
    type = timestamptz
    null = false
  }

  column "refresh_token_expires_at" {
    type = timestamptz
    null = false
  }

  column "provider_account_login" {
    type = varchar(255)
    null = false
  }

  index "idx_unique_account_provider_account_id" {
    columns = [column.provider_account_id, column.provider]
    unique  = true
  }

  index "idx_unique_account_user_id__provider" {
    columns = [column.user_id, column.provider]
    unique  = true
  }
}

table "user_referral" {
  schema = schema.public

  column "referrer_team_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "referrer_team_id" {
    columns     = [column.referrer_team_id]
    ref_columns = [table.team.column.id]
    on_delete   = CASCADE
  }

  column "team_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "team_id" {
    columns     = [column.team_id]
    ref_columns = [table.team.column.id]
    on_delete   = CASCADE
  }

  primary_key {
    columns = [column.team_id, column.referrer_team_id]
  }
}

table "oauth_account_refresh" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "account_id" {
    type    = varchar(21)
    null    = false
    default = ""
  }

  foreign_key "account_id" {
    columns     = [column.account_id]
    ref_columns = [table.account.column.id]
    on_delete   = CASCADE
  }
}

enum "team_type" {
  schema = schema.public
  values = ["github", "gitlab", "bitbucket", "user"]
}

enum "billing_status" {
  schema = schema.public
  values = ["not_created", "incomplete", "incomplete_expired", "active", "past_due", "canceled", "unpaid"]
}

enum "team_status" {
  schema = schema.public
  values = ["active", "suspended"]
}

table "team" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }

  column "status" {
    type    = enum.team_status
    null    = false
    default = "active"
  }

  column "snapshot_limit" {
    type    = integer
    null    = false
    default = 0
  }

  column "subscription_id" {
    type    = varchar(255)
    null    = false
    default = ""
  }

  column "customer_id" {
    type    = varchar(255)
    null    = false
    default = ""
  }

  column "created_at" {
    type = timestamptz
    null = false
  }
  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }
  column "avatar_url" {
    type = text
    null = false
  }
  column "url" {
    type = text
    null = false
  }
  column "type" {
    type = enum.team_type
    null = false
  }
  // Used for ensuring uniqueness of a users personal team
  column "owner_id" {
    type = varchar(21)
    null = true
  }

  foreign_key "owner_id" {
    columns     = [column.owner_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "external_id" {
    type = varchar(255)
    null = false
  }

  index "idx_unique_team_external_id" {
    columns = [column.external_id, column.type]
    where   = "type != 'user'"
    unique  = true
  }

  index "idx_unqiue_user_team" {
    columns = [column.type, column.owner_id]
    where   = "type = 'user'"
    unique  = true
  }
}

enum "git_installation_type" {
  schema = schema.public
  values = ["github", "gitlab", "bitbucket"]
}

table "git_installation" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }

  primary_key {
    columns = [column.id]
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "team_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "team_id" {
    columns     = [column.team_id]
    ref_columns = [table.team.column.id]
    on_delete   = CASCADE
  }

  column "type" {
    type = enum.git_installation_type
    null = false
  }

  column "installation_id" {
    type = integer
    null = false
  }

}

enum "team_member_role" {
  schema = schema.public
  values = ["owner", "admin", "accountant", "member"]
}

enum "member_type" {
  schema = schema.public
  values = ["invited", "git"]
}

table "team_users" {
  schema = schema.public
  column "team_id" {
    type = varchar(255)
    null = false
  }
  foreign_key "team_id" {
    columns     = [column.team_id]
    ref_columns = [table.team.column.id]
    on_delete   = CASCADE
  }

  column "user_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "user_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "role" {
    type = enum.team_member_role
    null = false
  }

  column "role_sync" {
    type    = boolean
    default = false
    null    = false
  }

  column "type" {
    type = enum.member_type
    null = false
  }

  index "idx_unique_team_user" {
    columns = [column.team_id, column.user_id]
    unique  = true
  }
}


enum "project_source" {
  schema = schema.public
  values = ["github", "gitlab", "bitbucket", "custom"]
}


table "project" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }

  column "created_at" {
    type = timestamptz
    null = false
  }
  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "team_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "team_id" {
    columns     = [column.team_id]
    ref_columns = [table.team.column.id]
    on_delete   = CASCADE
  }

  column "name" {
    type = varchar(255)
    null = false
  }
  column "url" {
    type = text
    null = false
  }
  column "source" {
    type = enum.project_source
    null = false
  }
  column "source_id" {
    type = varchar(255)
    null = false
  }
  column "token" {
    type = varchar(255)
    null = false
  }

  column "auto_approve" {
    type    = varchar(255)
    default = ""
    null    = false
  }

  column "snapshot_threshold" {
    type    = float
    null    = false
    default = 0.05
  }

  column "snapshot_blur" {
    type    = boolean
    null    = false
    default = false
  }

  // we use this to track the number of builds for a project & it allows us to create a unique index on build_number since we can lock the row 
  column "build_count" {
    type    = integer
    null    = false
    default = 0
  }
}

enum "project_member_role" {
  schema = schema.public
  values = ["admin", "reviewer", "viewer"]
}

table "project_users" {
  schema = schema.public
  column "project_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  column "user_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "user_id" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "role" {
    type = enum.project_member_role
    null = false
  }

  column "role_sync" {
    type    = boolean
    default = false
    null    = false
  }

  column "type" {
    type = enum.member_type
    null = false
  }

  index "idx_unique_project_user" {
    columns = [column.project_id, column.user_id]
    unique  = true
  }
}

enum "build_status" {
  schema = schema.public
  values = ["uploading", "queued-uploading", "queued-processing", "processing", "failed", "aborted", "approved", "rejected", "unreviewed", "unchanged", "orphaned"]
}

table "build" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }

  column "created_at" {
    type = timestamptz
    null = false
  }
  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "project_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  column "build_number" {
    type    = integer
    null    = false
    default = 0
  }
  column "status" {
    type    = enum.build_status
    null    = false
    default = "uploading"
  }

  column "sharding_id" {
    type    = varchar(255)
    null    = false
    default = ""
  }
  column "sharding_count" {
    type    = integer
    null    = false
    default = 0
  }

  column "shards_completed" {
    type    = integer
    null    = false
    default = 0
  }

  column "sha" {
    type = varchar(255)
    null = false
  }
  column "branch" {
    type = varchar(255)
    null = false
  }
  column "message" {
    type = varchar(255)
    null = false
  }
  column "title" {
    type = varchar(255)
    null = false
  }

  column "pr_id" {
    type = varchar(255)
    null = false
  }

  column "target_branch" {
    type = varchar(255)
    null = false
  }

  column "warnings" {
    type = sql("text[]")
    null = true
  }

  column "errors" {
    type = sql("text[]")
    null = true
  }

  index "idx_build-build_number__project_id" {
    columns = [column.project_id, column.build_number]
    unique  = true
  }

  index "idx_unique_build_project_id__sharding_id" {
    columns = [column.project_id, column.sharding_id]
    unique  = true
    where   = "sharding_id != ''"
  }

}


table "build_history" {
  schema = schema.public
  column "child_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "child_id" {
    columns     = [column.child_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }
  column "parent_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "parent_id" {
    columns     = [column.parent_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }

  primary_key {
    columns = [column.child_id, column.parent_id]
  }

  check "child_id_not_parent_id" {
    expr = "child_id != parent_id"
  }
}

table "build_targets" {
  schema = schema.public
  column "build_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "build_id" {
    columns     = [column.build_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }
  column "target_id" {
    type = varchar(255)
    null = false
  }

  foreign_key "target_id" {
    columns     = [column.target_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }

  primary_key {
    columns = [column.build_id, column.target_id]
  }

  check "build_id_not_target_id" {
    expr = "build_id != target_id"
  }
}

table "snap_image" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }
  column "created_at" {
    type = timestamptz
    null = false
  }
  column "hash" {
    type = varchar(64)
    null = false
  }

  column "width" {
    type = integer
    null = false
  }
  column "height" {
    type = integer
    null = false
  }
  column "format" {
    type = varchar(255)
    null = false
  }

  column "exists" {
    type    = boolean
    default = true
    null    = false
  }

  column "project_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  index "idx_snap_image-hash__project_id" {
    columns = [column.hash, column.project_id]
    unique  = true
  }
}

table "diff_image" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }
  column "created_at" {
    type = timestamptz
    null = false
  }
  column "hash" {
    type = varchar(64)
    null = false
  }

  column "width" {
    type = integer
    null = false
  }
  column "height" {
    type = integer
    null = false
  }
  column "format" {
    type = varchar(255)
    null = false
  }

  column "project_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  index "idx_diff_image-hash__project_id" {
    columns = [column.hash, column.project_id]
    unique  = true
  }
}

enum "snapshot_status" {
  schema = schema.public
  values = ["queued", "processing", "failed", "approved", "rejected", "unreviewed", "unchanged", "orphaned", "missing_baseline"]
}

table "snapshot" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }
  primary_key {
    columns = [column.id]
  }
  column "created_at" {
    type = timestamptz
    null = false
  }
  column "updated_at" {
    type = timestamptz
    null = false
  }

  column "build_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "build_id" {
    columns     = [column.build_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }

  column "snap_image_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "snap_image_id" {
    columns     = [column.snap_image_id]
    ref_columns = [table.snap_image.column.id]
  }

  column "name" {
    type = varchar(255)
    null = false
  }
  column "variant" {
    type = varchar(255)
    null = false
  }
  column "target" {
    type = varchar(255)
    null = false
  }
  column "target_icon" {
    type    = varchar(255)
    null    = false
    default = ""
  }
  column "viewport" {
    type = varchar(255)
    null = false
  }

  column "status" {
    type    = enum.snapshot_status
    null    = false
    default = "processing"
  }

  column "baseline_snapshot_id" {
    type = varchar(21)
    null = true
  }
  foreign_key "baseline_snapshot_id" {
    columns     = [column.baseline_snapshot_id]
    ref_columns = [table.snapshot.column.id]
    on_delete   = CASCADE
  }

  column "diff_image_id" {
    type = varchar(21)
    null = true
  }
  foreign_key "diff_image_id" {
    columns     = [column.diff_image_id]
    ref_columns = [table.diff_image.column.id]
    on_delete   = CASCADE
  }

  column "reviewer_id" {
    type = varchar(21)
    null = true
  }

  foreign_key "reviewer_id" {
    columns     = [column.reviewer_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "reviewed_at" {
    type = timestamptz
    null = true
  }

  column "error" {
    type = text
    null = false
  }

  index "idx_snapshot-build_id__name__variant__viewport__target" {
    columns = [column.build_id, column.name, column.variant, column.viewport, column.target]
    unique  = true
  }

  index "idx_snapshot-hash__project_id" {
    columns = [column.snap_image_id, column.build_id]
  }
}


table "user_deletion_request" {
  schema = schema.public
  column "user_id" {
    type = varchar(255)
    null = false
  }

  primary_key {
    columns = [column.user_id]
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "expires_at" {
    type = timestamptz
    null = false
  }
}

table "project_invite_code" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }

  primary_key {
    columns = [column.id]
  }

  column "project_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "role" {
    type = enum.project_member_role
    null = false
  }

  column "email" {
    type = varchar(255)
    null = false
  }

  column "invited_by_id" {
    type = varchar(21)
    null = false
  }

  foreign_key "invited_by_id" {
    columns     = [column.invited_by_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "expires_at" {
    type = timestamptz
    null = false
  }
}

table "snapshot_conversation" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }

  primary_key {
    columns = [column.id]
  }

  column "snapshot_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "snapshot_id" {
    columns     = [column.snapshot_id]
    ref_columns = [table.snapshot.column.id]
    on_delete   = CASCADE
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "x" {
    type = real
    null = false
  }

  column "y" {
    type = real
    null = false
  }
}

table "snapshot_conversation_message" {
  schema = schema.public
  column "id" {
    type = varchar(21)
    null = false
  }

  primary_key {
    columns = [column.id]
  }

  column "conversation_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "conversation_id" {
    columns     = [column.conversation_id]
    ref_columns = [table.snapshot_conversation.column.id]
    on_delete   = CASCADE
  }

  column "created_at" {
    type = timestamptz
    null = false
  }

  column "author_id" {
    type = varchar(21)
    null = false
  }
  foreign_key "author_id" {
    columns     = [column.author_id]
    ref_columns = [table.users.column.id]
    on_delete   = CASCADE
  }

  column "content" {
    type = text
    null = false
  }
}