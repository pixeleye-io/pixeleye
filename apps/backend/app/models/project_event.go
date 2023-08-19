package models

type ProjectEvent struct {
	Type string `json:"type"`

	Data interface{} `json:"data"`
}

type BuildStatusBody struct {
	BuildID string `json:"buildID"`
	Status  string `json:"status"`
}

type NewBuildBody struct {
	BuildID string `json:"buildID"`
}

const (
	ProjectEvent_BuildStatus = "build_status"
	ProjectEvent_NewBuild    = "new_build"
)
