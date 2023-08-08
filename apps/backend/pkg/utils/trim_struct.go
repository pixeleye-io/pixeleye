package utils

import (
	"encoding/json"
	"strings"
)

func TrimStruct(v interface{}) error {
	bytes, err := json.Marshal(v)
	if err != nil {
		return err
	}
	var mapSI map[string]interface{}
	if err := json.Unmarshal(bytes, &mapSI); err != nil {
		return err
	}
	mapSI = trimMapStringInterface(mapSI).(map[string]interface{})
	bytes2, err := json.Marshal(mapSI)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(bytes2, v); err != nil {
		return err
	}
	return nil
}

func trimMapStringInterface(data interface{}) interface{} {
	if values, valid := data.([]interface{}); valid {
		for i := range values {
			data.([]interface{})[i] = trimMapStringInterface(values[i])
		}
	} else if values, valid := data.(map[string]interface{}); valid {
		for k, v := range values {
			data.(map[string]interface{})[k] = trimMapStringInterface(v)
		}
	} else if value, valid := data.(string); valid {
		data = strings.TrimSpace(value)
	}
	return data
}
