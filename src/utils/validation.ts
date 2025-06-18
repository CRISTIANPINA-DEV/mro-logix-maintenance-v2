import { stations } from '@/data/stations';
import { airlines } from '@/data/airlines';
import { airplanes } from '@/data/airplanes';

export const validateStation = (code: string): boolean => {
  if (!code) return false;
  const upperCode = code.toUpperCase().trim();
  return stations.some(station => station.code === upperCode);
};

export const validateAirline = (name: string): boolean => {
  if (!name) return false;
  const normalizedName = name.trim();
  return airlines.some(airline => airline.name === normalizedName);
};

export const validateAirplane = (model: string): boolean => {
  if (!model) return false;
  const normalizedModel = model.trim();
  return airplanes.some(airplane => airplane.model === normalizedModel);
};

export const getStationSuggestions = (input: string): string[] => {
  if (!input) return [];
  const upperInput = input.toUpperCase().trim();
  return stations
    .filter(station => 
      station.code.includes(upperInput) || 
      station.name.toUpperCase().includes(upperInput)
    )
    .map(station => `${station.code} - ${station.name}`);
};

export const getAirlineSuggestions = (input: string): string[] => {
  if (!input) return [];
  const normalizedInput = input.toLowerCase().trim();
  return airlines
    .filter(airline => 
      airline.name.toLowerCase().includes(normalizedInput) ||
      airline.iataCode.toLowerCase().includes(normalizedInput)
    )
    .map(airline => `${airline.name} - ${airline.iataCode}`);
};

export const getAirplaneSuggestions = (input: string): string[] => {
  if (!input) return [];
  const normalizedInput = input.toLowerCase().trim();
  return airplanes
    .filter(airplane => 
      airplane.model.toLowerCase().includes(normalizedInput) ||
      airplane.manufacturer.toLowerCase().includes(normalizedInput)
    )
    .map(airplane => `${airplane.model} - ${airplane.manufacturer}`);
};

// Helper function to check if a value is from the suggestions list
export const isValueFromAirlineSuggestions = (value: string): boolean => {
  const name = value.includes(" - ") ? value.split(" - ")[0].trim() : value.trim();
  return airlines.some(airline => airline.name === name);
};

export const isValueFromStationSuggestions = (value: string): boolean => {
  // For stations, we need to handle both formats: "SDQ" and "SDQ - Las Americas International Airport"
  const code = value.includes(" - ") ? value.split(" - ")[0].trim() : value.trim();
  return stations.some(station => station.code === code.toUpperCase());
};

export const isValueFromAirplaneSuggestions = (value: string): boolean => {
  const model = value.includes(" - ") ? value.split(" - ")[0].trim() : value.trim();
  return airplanes.some(airplane => airplane.model === model);
};

// Clean value helpers
export const getCleanStationCode = (input: string): string => {
  return input.split(' - ')[0].toUpperCase().trim();
};

export const getCleanAirlineName = (input: string): string => {
  return input.split(' - ')[0].trim();
};

export const getCleanAirplaneModel = (input: string): string => {
  return input.split(' - ')[0].trim();
};

/**
 * Formats time input to HH:MM format
 * Accepts inputs like: 1526, 152, 15:26, 1:30, etc.
 * Returns formatted time as HH:MM or empty string if invalid
 */
export const formatTimeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove any non-digit characters except colon
  let cleaned = input.replace(/[^\d:]/g, '');
  
  // If already in HH:MM format and valid, return as is
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    return '';
  }
  
  // Handle pure number input
  if (cleaned.length === 0) return '';
  
  // Convert to 4-digit format if needed
  if (cleaned.length === 1 || cleaned.length === 2) {
    // Assume it's hours only (e.g., "1" -> "01:00", "15" -> "15:00")
    const hours = parseInt(cleaned);
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:00`;
    }
    return '';
  } else if (cleaned.length === 3) {
    // Assume first digit is hour, last two are minutes (e.g., "130" -> "01:30")
    const hours = parseInt(cleaned.substring(0, 1));
    const minutes = parseInt(cleaned.substring(1));
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '';
  } else if (cleaned.length === 4) {
    // Assume first two digits are hours, last two are minutes (e.g., "1526" -> "15:26")
    const hours = parseInt(cleaned.substring(0, 2));
    const minutes = parseInt(cleaned.substring(2));
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '';
  }
  
  return '';
};

/**
 * Validates if a time string is in valid HH:MM format
 */
export const isValidTimeFormat = (time: string): boolean => {
  if (!time) return true; // Empty is valid (optional field)
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}; 