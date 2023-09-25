package utils

// SafeDeref safely dereferences a pointer of any type T. If the pointer is nil, it returns a zero value of type T.
func SafeDeref[T any](p *T) T {
	if p == nil {
		var v T
		return v
	}
	return *p
}
