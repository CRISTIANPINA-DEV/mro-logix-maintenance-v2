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