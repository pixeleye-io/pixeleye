package models

type ProjectEvent struct {
	Type string `json:"type"`

	Data interface{} `json:"data"`
}

type BuildStatusBody struct {
	BuildID string `json:"buildID"`
	Status  string `json:"status"`
}
