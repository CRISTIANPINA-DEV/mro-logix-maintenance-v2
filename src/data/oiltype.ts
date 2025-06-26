export interface OilType {
    manufacturer: string;
    oiltype: string;
}
export const oiltypes: OilType[] = [
    // ENGINE OILS - Turbine
    { manufacturer: 'EASTMAN TURBO OIL 2380', oiltype: 'Engine' },
    { manufacturer: 'MOBIL JET OIL 387', oiltype: 'Engine' },
    { manufacturer: 'MOBIL JET OIL 254', oiltype: 'Engine' },
    { manufacturer: 'MOBIL JET OIL II', oiltype: 'Engine' },
    { manufacturer: 'MOBIL TURBINE OIL 308', oiltype: 'Engine' },
    { manufacturer: 'TURBONYCOIL 600', oiltype: 'Engine' },
    { manufacturer: 'AEROSHELL TURBINE OIL 560', oiltype: 'Engine' },
    { manufacturer: 'AEROSHELL TURBINE OIL 390', oiltype: 'Engine' },
    
    // ENGINE OILS - Piston Single Grade
    { manufacturer: 'AEROSHELL OIL W80', oiltype: 'Engine' },
    { manufacturer: 'AEROSHELL OIL W100', oiltype: 'Engine' },
    { manufacturer: 'AEROSHELL OIL W120', oiltype: 'Engine' },
    
    // ENGINE OILS - Piston Multi Grade
    { manufacturer: 'EXXON AVIATION ELITE 20W-50', oiltype: 'Engine' },
    { manufacturer: 'PHILLIPS 66 VICTORY 100AW', oiltype: 'Engine' },
    { manufacturer: 'PHILLIPS 66 VICTORY 80AW', oiltype: 'Engine' },
    { manufacturer: 'PHILLIPS 66 X/C 20W-50', oiltype: 'Engine' },
    { manufacturer: 'AEROSHELL OIL W100 PLUS', oiltype: 'Engine' },
    { manufacturer: 'AEROSHELL OIL W 15W-50', oiltype: 'Engine' },
    { manufacturer: 'TOTAL AERO DM 15W-50', oiltype: 'Engine' },
    
    // HYDRAULIC FLUIDS - Petroleum Based
    { manufacturer: 'MOBIL AERO HF', oiltype: 'Hydraulic' },
    { manufacturer: 'MOBIL AERO HFA', oiltype: 'Hydraulic' },
    { manufacturer: 'AEROSHELL FLUID 4', oiltype: 'Hydraulic' },
    { manufacturer: 'AEROSHELL FLUID 31', oiltype: 'Hydraulic' },
    { manufacturer: 'AEROSHELL FLUID 41', oiltype: 'Hydraulic' },
    
    // HYDRAULIC FLUIDS - Synthetic
    { manufacturer: 'MOBIL HYJET IV-A PLUS', oiltype: 'Hydraulic' },
    { manufacturer: 'MOBIL HYJET V', oiltype: 'Hydraulic' },
    { manufacturer: 'EASTMAN SKYDROL LD4', oiltype: 'Hydraulic' },
    { manufacturer: 'EASTMAN SKYDROL PE-5', oiltype: 'Hydraulic' },
    { manufacturer: 'EASTMAN SKYDROL 500B4', oiltype: 'Hydraulic' },
]
