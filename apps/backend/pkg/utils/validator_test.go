package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateNanoid(t *testing.T) {
	// Test a valid nanoid.
	validNanoid := "V1StGXR8_Z5jdHi6B-myT"
	assert.True(t, ValidateNanoid(validNanoid))

	// Test an invalid nanoid.
	invalidNanoid := "invalidnanoid"
	assert.False(t, ValidateNanoid(invalidNanoid))
}

func TestValidateViewport(t *testing.T) {
	// Test a valid viewport.
	validViewport := "1920x1080"
	assert.True(t, ValidateViewport(validViewport))

	// Test an invalid viewport.
	invalidViewport := "1920-1080"
	assert.False(t, ValidateViewport(invalidViewport))
}

func TestValidateNanoidArray(t *testing.T) {
	// Test a valid nanoid array.
	validNanoidArray := []string{"V1StGXR8_Z5jdHi6B-myT", "V1StGXR8_Z5jdHi6B-myT"}
	assert.True(t, ValidateNanoidArray(validNanoidArray))

	// Test an invalid nanoid array.
	invalidNanoidArray := []string{"V1StGXR8_Z5jdHi6B-myT", "invalidnanoid"}
	assert.False(t, ValidateNanoidArray(invalidNanoidArray))
}

func TestValidatorErrors(t *testing.T) {
	// Define a struct for testing validation errors.
	type TestStruct struct {
		Name     string `validate:"required"`
		Email    string `validate:"required,email"`
		Password string `validate:"required,min=8"`
	}

	// Test a struct with invalid fields.
	testStruct := TestStruct{}
	err := NewValidator().Struct(testStruct)
	errors := ValidatorErrors(err)

	assert.Equal(t, 3, len(errors))
	assert.Equal(t, "Key: 'TestStruct.Name' Error:Field validation for 'Name' failed on the 'required' tag", errors["Name"])
	assert.Equal(t, "Key: 'TestStruct.Email' Error:Field validation for 'Email' failed on the 'required' tag", errors["Email"])
	assert.Equal(t, "Key: 'TestStruct.Password' Error:Field validation for 'Password' failed on the 'required' tag", errors["Password"])

	// Test a struct with valid fields.
	testStruct = TestStruct{
		Name:     "John Doe",
		Email:    "johndoe@example.com",
		Password: "password",
	}
	err = NewValidator().Struct(testStruct)

	assert.Equal(t, nil, err)
}
