package models

import (
	"testing"
)

func TestCompareSnaps(t *testing.T) {
	testCases := []struct {
		name string
		a    Snapshot
		b    Snapshot
		want bool
	}{
		{
			name: "same",
			a:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			b:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			want: true,
		},
		{
			name: "different name",
			a:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			b:    Snapshot{Name: "snap2", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			want: false,
		},
		{
			name: "different variant",
			a:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			b:    Snapshot{Name: "snap1", Variant: "variant2", Target: "target1", Viewport: "viewport1"},
			want: false,
		},
		{
			name: "different target",
			a:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			b:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target2", Viewport: "viewport1"},
			want: false,
		},
		{
			name: "different viewport",
			a:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport1"},
			b:    Snapshot{Name: "snap1", Variant: "variant1", Target: "target1", Viewport: "viewport2"},
			want: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual := CompareSnaps(tc.a, tc.b)
			if tc.want != actual {
				t.Errorf("expected %v, but got %v", tc.want, actual)
			}
		})
	}
}
