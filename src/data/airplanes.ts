export interface Airplane {
  model: string;
  manufacturer: string;
}

export const airplanes: Airplane[] = [
  // Airbus Aircraft
  { model: 'A220', manufacturer: 'Airbus' },
  { model: 'A300', manufacturer: 'Airbus' },
  { model: 'A310', manufacturer: 'Airbus' },
  { model: 'A318', manufacturer: 'Airbus' },
  { model: 'A319', manufacturer: 'Airbus' },
  { model: 'A320', manufacturer: 'Airbus' },
  { model: 'A320-Cargo', manufacturer: 'Airbus' },
  { model: 'A320neo', manufacturer: 'Airbus' },
  { model: 'A321', manufacturer: 'Airbus' },
  { model: 'A321neo', manufacturer: 'Airbus' },
  { model: 'A330', manufacturer: 'Airbus' },
  { model: 'A330-Freighter', manufacturer: 'Airbus' },
  { model: 'A330neo', manufacturer: 'Airbus' },
  { model: 'A340', manufacturer: 'Airbus' },
  { model: 'A340-Freighter', manufacturer: 'Airbus' },
  { model: 'A350', manufacturer: 'Airbus' },
  { model: 'A350F-Freighter', manufacturer: 'Airbus' },
  { model: 'A380', manufacturer: 'Airbus' },
  
  // Boeing Aircraft
  { model: 'B707', manufacturer: 'Boeing' },
  { model: 'B727', manufacturer: 'Boeing' },
  { model: 'B737', manufacturer: 'Boeing' },
  { model: 'B737-Cargo', manufacturer: 'Boeing' },
  { model: 'B737NG', manufacturer: 'Boeing' },
  { model: 'B737MAX 8', manufacturer: 'Boeing' },
  { model: 'B737MAX 9', manufacturer: 'Boeing' },
  { model: 'B747', manufacturer: 'Boeing' },
  { model: 'B757', manufacturer: 'Boeing' },
  { model: 'B767', manufacturer: 'Boeing' },
  { model: 'B777', manufacturer: 'Boeing' },
  { model: 'B787', manufacturer: 'Boeing' },
  
  // McDonnell Douglas Aircraft
  { model: 'DC-9', manufacturer: 'McDonnell Douglas' },
  { model: 'DC-10', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-80', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-81', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-82', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-83', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-87', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-88', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-90', manufacturer: 'McDonnell Douglas' },
  { model: 'MD-11', manufacturer: 'McDonnell Douglas' },
  
  // Embraer Aircraft
  { model: 'ERJ-135', manufacturer: 'Embraer' },
  { model: 'ERJ-140', manufacturer: 'Embraer' },
  { model: 'ERJ-145', manufacturer: 'Embraer' },
  { model: 'E170', manufacturer: 'Embraer' },
  { model: 'E175', manufacturer: 'Embraer' },
  { model: 'E190', manufacturer: 'Embraer' },
  { model: 'E195', manufacturer: 'Embraer' },
  { model: 'E190-E2', manufacturer: 'Embraer' },
  { model: 'E195-E2', manufacturer: 'Embraer' },

  // ATR Aircraft
  { model: 'ATR-42', manufacturer: 'ATR' },
  { model: 'ATR-42-600', manufacturer: 'ATR' },
  { model: 'ATR-72', manufacturer: 'ATR' },
  { model: 'ATR-72-600', manufacturer: 'ATR' },
  
  // Bombardier Aircraft
  { model: 'CRJ-100', manufacturer: 'Bombardier' },
  { model: 'CRJ-200', manufacturer: 'Bombardier' },
  { model: 'CRJ-700', manufacturer: 'Bombardier' },
  { model: 'CRJ-900', manufacturer: 'Bombardier' },
  { model: 'CRJ-1000', manufacturer: 'Bombardier' },
  { model: 'Dash 8-100', manufacturer: 'Bombardier' },
  { model: 'Dash 8-200', manufacturer: 'Bombardier' },
  { model: 'Dash 8-300', manufacturer: 'Bombardier' },
  { model: 'Dash 8 Q400', manufacturer: 'Bombardier' },

  // Cessna Aircraft
  { model: 'Cessna 150', manufacturer: 'Cessna' },
  { model: 'Cessna 152', manufacturer: 'Cessna' },
  { model: 'Cessna 162 Skycatcher', manufacturer: 'Cessna' },
  { model: 'Cessna 170', manufacturer: 'Cessna' },
  { model: 'Cessna 172 Skyhawk', manufacturer: 'Cessna' },
  { model: 'Cessna 177 Cardinal', manufacturer: 'Cessna' },
  { model: 'Cessna 182 Skylane', manufacturer: 'Cessna' },
  { model: 'Cessna 185 Skywagon', manufacturer: 'Cessna' },
  { model: 'Cessna 206 Stationair', manufacturer: 'Cessna' },
  { model: 'Cessna 210 Centurion', manufacturer: 'Cessna' },
  { model: 'Cessna 337 Skymaster', manufacturer: 'Cessna' },
  { model: 'Cessna 340', manufacturer: 'Cessna' },
  { model: 'Cessna 402', manufacturer: 'Cessna' },
  { model: 'Cessna 414 Chancellor', manufacturer: 'Cessna' },
  { model: 'Cessna 421 Golden Eagle', manufacturer: 'Cessna' },
  { model: 'Cessna 208 Caravan', manufacturer: 'Cessna' },
  { model: 'Cessna 208B Grand Caravan EX', manufacturer: 'Cessna' },
  { model: 'Cessna Citation I', manufacturer: 'Cessna' },
  { model: 'Cessna Citation II', manufacturer: 'Cessna' },
  { model: 'Cessna Citation V', manufacturer: 'Cessna' },
  { model: 'Cessna CitationJet/M2 (CJ1-CJ4)', manufacturer: 'Cessna' },
  { model: 'Cessna Citation Excel/XLS', manufacturer: 'Cessna' },
  { model: 'Cessna Citation Sovereign', manufacturer: 'Cessna' },
  { model: 'Cessna Citation Latitude', manufacturer: 'Cessna' },
  { model: 'Cessna Citation Longitude', manufacturer: 'Cessna' },

  // COMAC Aircraft
  { model: 'ARJ21', manufacturer: 'COMAC' },
  { model: 'C909', manufacturer: 'COMAC' },
  { model: 'C919', manufacturer: 'COMAC' },
  { model: 'C929', manufacturer: 'COMAC' },

  // Gulfstream Aircraft
  { model: 'Gulfstream I (G-159)', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream II (G-II)', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream III (G-III)', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream IV (G-IV)', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G300', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G400', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream V (G-V)', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G500', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G550', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G600', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G650', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G650ER', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G700', manufacturer: 'Gulfstream' },
  { model: 'Gulfstream G800', manufacturer: 'Gulfstream' },

  // Dassault Aviation Aircraft
  { model: 'Falcon 10', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 20', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 50', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 100', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 200', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 2000', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 2000EX', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 2000LXS', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 900', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 900EX', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 900LX', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 7X', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 8X', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 6X', manufacturer: 'Dassault Aviation' },
  { model: 'Falcon 10X', manufacturer: 'Dassault Aviation' },

  // Beechcraft Aircraft
  { model: 'Model 18 (Twin Beech)', manufacturer: 'Beechcraft' },
  { model: 'Bonanza 35', manufacturer: 'Beechcraft' },
  { model: 'Bonanza G36', manufacturer: 'Beechcraft' },
  { model: 'Baron 55', manufacturer: 'Beechcraft' },
  { model: 'Baron G58', manufacturer: 'Beechcraft' },
  { model: 'Duke B60', manufacturer: 'Beechcraft' },
  { model: 'King Air C90', manufacturer: 'Beechcraft' },
  { model: 'King Air E90', manufacturer: 'Beechcraft' },
  { model: 'King Air 100', manufacturer: 'Beechcraft' },
  { model: 'King Air 200', manufacturer: 'Beechcraft' },
  { model: 'King Air B200', manufacturer: 'Beechcraft' },
  { model: 'King Air 250', manufacturer: 'Beechcraft' },
  { model: 'King Air 260', manufacturer: 'Beechcraft' },
  { model: 'King Air 300', manufacturer: 'Beechcraft' },
  { model: 'King Air 350', manufacturer: 'Beechcraft' },
  { model: 'King Air 360', manufacturer: 'Beechcraft' },
  { model: 'Beech 1900D', manufacturer: 'Beechcraft' },
  { model: 'Premier I', manufacturer: 'Beechcraft' },
  { model: 'Premier IA', manufacturer: 'Beechcraft' },
  { model: 'Beechjet 400', manufacturer: 'Beechcraft' },
  { model: 'Beechjet 400A', manufacturer: 'Beechcraft' },
  { model: 'Hawker 400XP', manufacturer: 'Beechcraft' },

  // Pilatus Aircraft
  { model: 'PC-6 Porter', manufacturer: 'Pilatus' },
  { model: 'PC-12', manufacturer: 'Pilatus' },
  { model: 'PC-12 NGX', manufacturer: 'Pilatus' },
  { model: 'PC-24', manufacturer: 'Pilatus' },

  // Piper Aircraft
  { model: 'J-3 Cub', manufacturer: 'Piper' },
  { model: 'PA-18 Super Cub', manufacturer: 'Piper' },
  { model: 'PA-28 Cherokee', manufacturer: 'Piper' },
  { model: 'PA-28 Archer', manufacturer: 'Piper' },
  { model: 'PA-28R Arrow', manufacturer: 'Piper' },
  { model: 'PA-32 Cherokee Six', manufacturer: 'Piper' },
  { model: 'PA-32R Saratoga', manufacturer: 'Piper' },
  { model: 'PA-34 Seneca', manufacturer: 'Piper' },
  { model: 'PA-44 Seminole', manufacturer: 'Piper' },
  { model: 'PA-46 Malibu', manufacturer: 'Piper' },
  { model: 'PA-46-350P Mirage', manufacturer: 'Piper' },
  { model: 'PA-46-500TP Meridian', manufacturer: 'Piper' },
  { model: 'M350', manufacturer: 'Piper' },
  { model: 'M500', manufacturer: 'Piper' },
  { model: 'M600 SLS', manufacturer: 'Piper' },

  // Tupolev Aircraft
  { model: 'Tu-104', manufacturer: 'Tupolev' },
  { model: 'Tu-134', manufacturer: 'Tupolev' },
  { model: 'Tu-154', manufacturer: 'Tupolev' },
  { model: 'Tu-204', manufacturer: 'Tupolev' },
  { model: 'Tu-214', manufacturer: 'Tupolev' },

  // Ilyushin Aircraft
  { model: 'Il-18', manufacturer: 'Ilyushin' },
  { model: 'Il-62', manufacturer: 'Ilyushin' },
  { model: 'Il-86', manufacturer: 'Ilyushin' },
  { model: 'Il-96', manufacturer: 'Ilyushin' },

  // Yakovlev Aircraft
  { model: 'SSJ100', manufacturer: 'Yakovlev' },

  // British Aerospace / Avro Aircraft
  { model: 'BAe 146', manufacturer: 'British Aerospace' },
  { model: 'Avro RJ70', manufacturer: 'Avro' },
  { model: 'Avro RJ85', manufacturer: 'Avro' },
  { model: 'Avro RJ100', manufacturer: 'Avro' },

  // Mitsubishi Aircraft
  { model: 'Mitsubishi SpaceJet M90', manufacturer: 'Mitsubishi Aircraft' }
]; 