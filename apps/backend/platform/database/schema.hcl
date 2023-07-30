schema "public" {}

schema "private" {}

enum "team_type" {
  schema = schema.public
  values = ["github", "gitlab", "bitbucket", "user"]
}

table "team" {
  schema = schema.public
  column "id" {
    type = char(21)
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
}

enum "team_member_role" {
  schema = schema.public
  values = ["owner", "admin", "accountant", "member"]
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
    type = varchar(255)
    null = false
  }

  column "role" {
    type = enum.team_member_role
    null = false
  }
}


enum "project_source" {
  schema = schema.public
  values = ["github", "gitlab", "bitbucket", "custom"]
}


table "project" {
  schema = schema.public
  column "id" {
    type = char(21)
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
    type = char(21)
    null = false
  }

  column "name" {
    type = varchar(255)
    null = false
  }
  column "url" {
    type = text
    null = true
  }
  column "source" {
    type = enum.project_source
    null = false
  }
  column "source_id" {
    type = varchar(255)
    null = true
  }
  column "token" {
    type = varchar(255)
    null = true
  }
}

enum "project_member_role" {
  schema = schema.public
  values = ["owner", "admin", "reviewer", "viewer"]
}

table "project_users" {
  schema = schema.public
  column "project_id" {
    type = char(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  column "user_id" {
    type = varchar(255)
    null = false
  }

  column "role" {
    type = enum.project_member_role
    null = false
  }
}

enum "build_status" {
  schema = schema.public
  values = ["uploading", "processing", "failed", "aborted", "approved", "rejected", "unreviewed", "unchanged", "orphaned"]
}

table "build" {
  schema = schema.public
  column "id" {
    type = char(21)
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
    type = char(21)
    null = false
  }
  foreign_key "project_id" {
    columns     = [column.project_id]
    ref_columns = [table.project.column.id]
    on_delete   = CASCADE
  }

  column "target_parent_id" {
    type = char(21)
    null = false
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

  column "target_build_id" {
    type = char(21)
    null = false
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
    null = true
  }
  column "title" {
    type = varchar(255)
    null = true
  }

  column "warnings" {
    type = sql("text[]")
    null = true
  }

  column "errors" {
    type = sql("text[]")
    null = true
  }

  column "deleted_snapshot_ids" {
    type = sql("text[]")
    null = true
  }

  column "approved_by" {
    type = char(21)
    null = true
  }

  index "idx_build-build_number__project_id" {
    columns = [column.project_id, column.build_number]
    unique  = true
  }
}

table "build_history" {
  schema = schema.public
  column "child_id" {
    type = char(21)
    null = false
  }
  foreign_key "child_id" {
    columns     = [column.child_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }
  column "parent_id" {
    type = char(21)
    null = false
  }
  foreign_key "parent_id" {
    columns     = [column.parent_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }
}

table "snap_image" {
  schema = schema.public
  column "id" {
    type = char(21)
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
  column "project_id" {
    type = char(21)
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
    type = char(21)
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
  column "project_id" {
    type = char(21)
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
  values = ["processing", "failed", "aborted", "approved", "rejected", "unreviewed", "unchanged", "orphaned"]
}

table "snapshot" {
  schema = schema.public
  column "id" {
    type = char(21)
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
    type = char(21)
    null = false
  }
  foreign_key "build_id" {
    columns     = [column.build_id]
    ref_columns = [table.build.column.id]
    on_delete   = CASCADE
  }

  column "snap_image_id" {
    type = char(21)
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

  column "status" {
    type    = enum.snapshot_status
    null    = false
    default = "processing"
  }

  column "baseline_snapshot_id" {
    type = char(21)
    null = true
  }
  foreign_key "baseline_snapshot_id" {
    columns     = [column.baseline_snapshot_id]
    ref_columns = [table.snapshot.column.id]
    on_delete   = CASCADE
  }

  column "diff_image_id" {
    type = char(21)
    null = true
  }
  foreign_key "diff_image_id" {
    columns     = [column.diff_image_id]
    ref_columns = [table.diff_image.column.id]
    on_delete   = CASCADE
  }

  column "reviewer_id" {
    type = char(21)
    null = true
  }
  column "reviewed_at" {
    type = timestamptz
    null = true
  }

  index "idx_snapshot-build_id__name__variant__target" {
    columns = [column.build_id, column.name, column.variant, column.target]
    unique  = true
  }
}


