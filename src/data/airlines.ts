export interface Airline {
  name: string;
  icaoCode: string;
}

// { name: 'AIRLINENAME', icaoCode: 'ICAO_CODE' },
// { name: '', icaoCode: '' },
export const airlines: Airline[] = [
  { name: '21 Air', icaoCode: 'CSB' },
  { name: '247 Aviation', icaoCode: 'EMC' },
  { name: '2Excel Aviation', icaoCode: 'BRO' },
  { name: '30 West Jets', icaoCode: 'LVA' },
  { name: '4Airways', icaoCode: 'DAK' },
  { name: '748 Air Services', icaoCode: 'IHO' },
  { name: '7Air Cargo', icaoCode: 'TXG' },
  { name: '9 Air', icaoCode: 'JYH' },
  { name: 'Abakan Air', icaoCode: 'NKP' },
  { name: 'Abu Dhabi Aviation', icaoCode: 'BAR' },
  { name: 'ABX Air', icaoCode: 'ABX' },
  { name: 'ACASS Ireland', icaoCode: 'SON' },
  { name: 'Advanced Air', icaoCode: 'WSN' }
];