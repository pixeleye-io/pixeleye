package queries

import "fmt"

type QueryError struct {
	Code    int
	Message string
}

func (q QueryError) Error() string {
	return q.Message
}

func BuildError(code int, format string, a ...any) QueryError {
	return QueryError{
		Code:    code,
		Message: fmt.Sprintf(format, a...),
	}
}

func (q QueryError) IsError() bool {
	return !(q.Code >= 200 && q.Code < 300)
}
