# Pixeleye backend

This is a golang based backend for the Pixeleye project. This project contains two main components:

- The API server
- The image processor

Whilst we have separate entrypoints for these two components, they can both be run from the same binary.

## Notable technologies

Pixeleye is built upon a number of technologies. Here are some of the most notable ones:

- (Echo)[https://echo.labstack.com/] - Web framework
- (PostgreSQL)[https://www.postgresql.org/] - Database
- (RabbitMQ)[https://www.rabbitmq.com/] - Message broker
- (Ory Kratos)[https://www.ory.sh/kratos] - Identity and user management
- (S3 based storage)[https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html] - Storage
- (SQLX)[https://github.com/jmoiron/sqlx] - Database library
- (Atlas)[https://atlasgo.io/] - Database migration tool
