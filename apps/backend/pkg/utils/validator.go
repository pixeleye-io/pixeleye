package utils

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

func ValidateNanoid(id string) bool {
	return (len(id) == 21)
}

func ValidateViewport(viewport string) bool {
	viewportRegex := regexp.MustCompile(`^\d+x\d+$`)

	return viewportRegex.MatchString(viewport)
}

// NewValidator func for create a new validator for model fields.
func NewValidator() *validator.Validate {
	// Create a new validator for a Book model.
	validate := validator.New()

	// validator for nanoid
	_ = validate.RegisterValidation("nanoid", func(fl validator.FieldLevel) bool {
		field := fl.Field().String()
		return ValidateNanoid(field)
	})

	// validator for viewport
	_ = validate.RegisterValidation("viewport", func(fl validator.FieldLevel) bool {
		field := fl.Field().String()
		return ValidateViewport(field)
	})

	return validate
}

// ValidatorErrors func for show validation errors for each invalid fields.
func ValidatorErrors(err error) map[string]string {
	// Define fields map.
	fields := map[string]string{}

	// Make error message for each invalid field.
	for _, err := range err.(validator.ValidationErrors) {
		fields[err.Field()] = err.Error()
	}

	return fields
}
