package models

import "testing"

func TestIsBuildPreProcessing(t *testing.T) {
	tests := []struct {
		name   string
		status string
		want   bool
	}{
		{
			name:   "TestIsBuildPreProcessing - uploading",
			status: "uploading",
			want:   true,
		},
		{
			name:   "TestIsBuildPreProcessing - queued-uploading",
			status: "queued-uploading",
			want:   true,
		},
		{
			name:   "TestIsBuildPreProcessing - aborted",
			status: "aborted-uploading",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - queued-processing",
			status: "queued-processing",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - processing",
			status: "processing",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - failed",
			status: "failed",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - approved",
			status: "approved",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - rejected",
			status: "rejected",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - unreviewed",
			status: "unreviewed",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - unchanged",
			status: "unchanged",
			want:   false,
		},
		{
			name:   "TestIsBuildPreProcessing - orphaned",
			status: "orphaned",
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsBuildPreProcessing(tt.status); got != tt.want {
				t.Errorf("IsBuildPreProcessing() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsBuildProcessing(t *testing.T) {
	tests := []struct {
		name   string
		status string
		want   bool
	}{
		{
			name:   "TestIsBuildProcessing - uploading",
			status: "uploading",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - queued-uploading",
			status: "queued-uploading",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - aborted",
			status: "aborted",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - queued-processing",
			status: "queued-processing",
			want:   true,
		},
		{
			name:   "TestIsBuildProcessing - processing",
			status: "processing",
			want:   true,
		},
		{
			name:   "TestIsBuildProcessing - failed",
			status: "failed",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - approved",
			status: "approved",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - rejected",
			status: "rejected",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - unreviewed",
			status: "unreviewed",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - unchanged",
			status: "unchanged",
			want:   false,
		},
		{
			name:   "TestIsBuildProcessing - orphaned",
			status: "orphaned",
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsBuildProcessing(tt.status); got != tt.want {
				t.Errorf("IsBuildProcessing() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsBuildPostProcessing(t *testing.T) {
	tests := []struct {
		name   string
		status string
		want   bool
	}{
		{
			name:   "TestIsBuildPostProcessing - uploading",
			status: "uploading",
			want:   false,
		},
		{
			name:   "TestIsBuildPostProcessing - queued-uploading",
			status: "queued-uploading",
			want:   false,
		},
		{
			name:   "TestIsBuildPostProcessing - aborted",
			status: "aborted-uploading",
			want:   true,
		},
		{
			name:   "TestIsBuildPostProcessing - queued-processing",
			status: "queued-processing",
			want:   false,
		},
		{
			name:   "TestIsBuildPostProcessing - processing",
			status: "processing",
			want:   false,
		},
		{
			name:   "TestIsBuildPostProcessing - failed",
			status: "failed",
			want:   true,
		},
		{
			name:   "TestIsBuildPostProcessing - approved",
			status: "approved",
			want:   true,
		},
		{
			name:   "TestIsBuildPostProcessing - rejected",
			status: "rejected",
			want:   true,
		},
		{
			name:   "TestIsBuildPostProcessing - unreviewed",
			status: "unreviewed",
			want:   true,
		},
		{
			name:   "TestIsBuildPostProcessing - unchanged",
			status: "unchanged",
			want:   true,
		},
		{
			name:   "TestIsBuildPostProcessing - orphaned",
			status: "orphaned",
			want:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsBuildPostProcessing(tt.status); got != tt.want {
				t.Errorf("IsBuildPostProcessing() = %v, want %v", got, tt.want)
			}
		})
	}
}
