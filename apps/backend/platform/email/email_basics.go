package email

import (
	"encoding/base64"
	"fmt"
	"net/mail"
	"net/smtp"
	"os"
)

func SendEmail(to string, title string, body string) error {

	from := mail.Address{Name: "Pixeleye", Address: os.Getenv("SMTP_SENDER")}
	recipient := mail.Address{Name: "", Address: to}

	// smtp server configuration.
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")

	// Authentication.
	auth := smtp.PlainAuth("", username, password, smtpHost)

	header := make(map[string]string)
	header["From"] = from.String()
	header["To"] = recipient.String()
	header["Subject"] = title
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/plain; charset=\"utf-8\""
	header["Content-Transfer-Encoding"] = "base64"

	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + base64.StdEncoding.EncodeToString([]byte(body))

	// Sending email.
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from.Address, []string{to}, []byte(message))
	if err != nil {
		return err
	}

	return nil
}
