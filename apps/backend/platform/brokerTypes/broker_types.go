package brokerTypes

import "fmt"

type QueueType int

const (
	BuildProcess QueueType = iota
	ProjectUpdate
)

type Send func(queueType QueueType, queueName string, body []byte) error

type Subscribe func(queueType QueueType, queueName string, callback func([]byte) error, quit chan bool) error

type Broker struct {
	Send Send
}

func (t QueueType) String() (string, error) {
	switch t {
	case BuildProcess:
		return "build_process", nil
	case ProjectUpdate:
		return "project_update", nil
	}
	return "", fmt.Errorf("queue type '%v' is not supported", t)
}
