package main

import (
	"fmt"

	"github.com/joho/godotenv"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
)

func main() {
	godotenv.Load("./../../.env")

	// Create rabbitmq
	connection := broker.GetConnection()
	defer broker.Close()

	quit := make(chan bool)
	count := 0
	broker.SubscribeToQueue(connection, "", brokerTypes.BuildProcess, func(msg []byte) error {
		fmt.Println("Received a message: %s", string(msg))
		count += 1
		if count == 10 {
			quit <- true
		}
		return nil
	}, quit)
}
