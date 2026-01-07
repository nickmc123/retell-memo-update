/**
 * Package Type API - Scheduling Rules Lookup
 *
 * Maps pkg_code2 to package type details including:
 * - Number of nights
 * - Departure day rules (Mon/Tue/Wed vs Mon/Tue only)
 * - Calendar type (air, cruise, land-only)
 * - Destination and departure city
 *
 * For use with Casablanca Express Scheduling Agent
 */

// =============================================================================
// PACKAGE TYPE DEFINITIONS
// =============================================================================

/**
 * Package Type Categories
 *
 * AIR packages follow day-of-week rules:
 * - 2-night air: Monday, Tuesday, Wednesday departures only
 * - 3-night air: Monday, Tuesday departures only
 *
 * CRUISE packages follow specific date calendars
 * LAND-ONLY packages have flexible dates
 */

const PACKAGE_TYPES = {
    // 2-Night Air + All-Inclusive (Mon/Tue/Wed)
    '2-night-air-all-inclusive': {
        nights: 2,
        calendar_type: 'air',
        departure_rules: {
            allowed_days: ['Monday', 'Tuesday', 'Wednesday'],
            day_numbers: [1, 2, 3] // 0=Sun, 1=Mon, 2=Tue, 3=Wed
        },
        description: 'Roundtrip Air and Two Nights stay for Two - All inclusive'
    },

    // 3-Night Air + All-Inclusive (Mon/Tue ONLY)
    '3-night-air-all-inclusive': {
        nights: 3,
        calendar_type: 'air',
        departure_rules: {
            allowed_days: ['Monday', 'Tuesday'],
            day_numbers: [1, 2]
        },
        description: 'Roundtrip Air and Three Nights stay for Two - All inclusive'
    },

    // 2-Night Air + Hotel (Mon/Tue/Wed)
    '2-night-air-hotel': {
        nights: 2,
        calendar_type: 'air',
        departure_rules: {
            allowed_days: ['Monday', 'Tuesday', 'Wednesday'],
            day_numbers: [1, 2, 3]
        },
        description: 'Roundtrip Air and Two Nights stay for Two'
    },

    // Cruise Only (specific dates from cruise calendar)
    'cruise-3-night': {
        nights: 3,
        calendar_type: 'cruise',
        departure_rules: {
            allowed_days: null, // Use cruise calendar
            day_numbers: null
        },
        description: '3 Nights Cruise'
    },

    'cruise-4-night': {
        nights: 4,
        calendar_type: 'cruise',
        departure_rules: {
            allowed_days: null,
            day_numbers: null
        },
        description: '4 Nights Cruise'
    },

    'cruise-5-night': {
        nights: 5,
        calendar_type: 'cruise',
        departure_rules: {
            allowed_days: null,
            day_numbers: null
        },
        description: '5 Nights Cruise'
    },

    'cruise-7-night': {
        nights: 7,
        calendar_type: 'cruise',
        departure_rules: {
            allowed_days: null,
            day_numbers: null
        },
        description: '7 Nights Cruise'
    },

    // Cruise + Air (specific dates from cruise calendar)
    'cruise-air-4-night': {
        nights: 4,
        calendar_type: 'cruise',
        departure_rules: {
            allowed_days: null,
            day_numbers: null
        },
        description: '4 Nights Cruise with Airfare'
    },

    // Land Only (flexible dates)
    'land-only-4-night': {
        nights: 4,
        calendar_type: 'land',
        departure_rules: {
            allowed_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            day_numbers: [0, 1, 2, 3, 4, 5, 6]
        },
        description: '4 Nights Resort Stay - Land Only'
    },

    'land-only-7-night': {
        nights: 7,
        calendar_type: 'land',
        departure_rules: {
            allowed_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            day_numbers: [0, 1, 2, 3, 4, 5, 6]
        },
        description: '7 Nights Resort Stay - Land Only'
    }
};

// =============================================================================
// PREFIX TO PACKAGE TYPE MAPPING
// =============================================================================

/**
 * Maps pkg_code2 prefixes to package types
 *
 * Structure:
 * - prefix: The starting characters of pkg_code2
 * - package_type: Key from PACKAGE_TYPES
 * - destinations: Object mapping suffix codes to destination/departure city
 */

const PREFIX_MAPPINGS = [
    // ==========================================================================
    // 3-NIGHT AIR + ALL-INCLUSIVE (MIW) - Mon/Tue departures only
    // ==========================================================================
    {
        prefix: 'MIW',
        package_type: '3-night-air-all-inclusive',
        destinations: {
            // Cancun
            'CA': { destination: 'Cancun', depart_city: 'Austin' },
            'CW': { destination: 'Cancun', depart_city: 'Dallas' },
            'CD': { destination: 'Cancun', depart_city: 'Denver' },
            'CH': { destination: 'Cancun', depart_city: 'Houston' },
            'CV': { destination: 'Cancun', depart_city: 'Las Vegas' },
            'CF': { destination: 'Cancun', depart_city: 'Phoenix' },
            'CS': { destination: 'Cancun', depart_city: 'San Francisco' },
            'CU': { destination: 'Cancun', depart_city: 'Salt Lake City' },
            // Dominican Republic
            'DA': { destination: 'Dominican Republic', depart_city: 'Austin' },
            'DW': { destination: 'Dominican Republic', depart_city: 'Dallas' },
            'DD': { destination: 'Dominican Republic', depart_city: 'Denver' },
            'DH': { destination: 'Dominican Republic', depart_city: 'Houston' },
            'DV': { destination: 'Dominican Republic', depart_city: 'Las Vegas' },
            'DF': { destination: 'Dominican Republic', depart_city: 'Phoenix' },
            'DS': { destination: 'Dominican Republic', depart_city: 'San Francisco' },
            'DU': { destination: 'Dominican Republic', depart_city: 'Salt Lake City' },
            // Los Cabos
            'LA': { destination: 'Los Cabos', depart_city: 'Austin' },
            'LW': { destination: 'Los Cabos', depart_city: 'Dallas' },
            'LD': { destination: 'Los Cabos', depart_city: 'Denver' },
            'LH': { destination: 'Los Cabos', depart_city: 'Houston' },
            'LV': { destination: 'Los Cabos', depart_city: 'Las Vegas' },
            'LF': { destination: 'Los Cabos', depart_city: 'Phoenix' },
            'LS': { destination: 'Los Cabos', depart_city: 'San Francisco' },
            'LU': { destination: 'Los Cabos', depart_city: 'Salt Lake City' },
            // Puerto Vallarta
            'VA': { destination: 'Puerto Vallarta', depart_city: 'Austin' },
            'VW': { destination: 'Puerto Vallarta', depart_city: 'Dallas' },
            'VD': { destination: 'Puerto Vallarta', depart_city: 'Denver' },
            'VH': { destination: 'Puerto Vallarta', depart_city: 'Houston' },
            'VV': { destination: 'Puerto Vallarta', depart_city: 'Las Vegas' },
            'VF': { destination: 'Puerto Vallarta', depart_city: 'Phoenix' },
            'VS': { destination: 'Puerto Vallarta', depart_city: 'San Francisco' },
            'VU': { destination: 'Puerto Vallarta', depart_city: 'Salt Lake City' }
        }
    },

    // ==========================================================================
    // 2-NIGHT AIR + ALL-INCLUSIVE (MIG) - Mon/Tue/Wed departures
    // ==========================================================================
    {
        prefix: 'MIG',
        package_type: '2-night-air-all-inclusive',
        destinations: {
            // Cancun
            'CA': { destination: 'Cancun', depart_city: 'Austin' },
            'CW': { destination: 'Cancun', depart_city: 'Dallas' },
            'CD': { destination: 'Cancun', depart_city: 'Denver' },
            'CH': { destination: 'Cancun', depart_city: 'Houston' },
            'CV': { destination: 'Cancun', depart_city: 'Las Vegas' },
            'CF': { destination: 'Cancun', depart_city: 'Phoenix' },
            'CS': { destination: 'Cancun', depart_city: 'San Francisco' },
            'CU': { destination: 'Cancun', depart_city: 'Salt Lake City' },
            // Puerto Vallarta
            'VA': { destination: 'Puerto Vallarta', depart_city: 'Austin' },
            'VW': { destination: 'Puerto Vallarta', depart_city: 'Dallas' },
            'VD': { destination: 'Puerto Vallarta', depart_city: 'Denver' },
            'VH': { destination: 'Puerto Vallarta', depart_city: 'Houston' },
            'VV': { destination: 'Puerto Vallarta', depart_city: 'Las Vegas' },
            'VF': { destination: 'Puerto Vallarta', depart_city: 'Phoenix' },
            'VS': { destination: 'Puerto Vallarta', depart_city: 'San Francisco' },
            'VU': { destination: 'Puerto Vallarta', depart_city: 'Salt Lake City' }
        }
    },

    // ==========================================================================
    // 2-NIGHT AIR + HOTEL (DB) - Mon/Tue/Wed departures
    // ==========================================================================
    {
        prefix: 'DB',
        package_type: '2-night-air-hotel',
        destinations: {
            // Various US cities - suffix indicates departure city
            'AT': { destination: 'Various', depart_city: 'Atlanta' },
            'AU': { destination: 'Various', depart_city: 'Austin' },
            'BF': { destination: 'Various', depart_city: 'Buffalo' },
            'BL': { destination: 'Various', depart_city: 'Baltimore' },
            'BO': { destination: 'Various', depart_city: 'Boston' },
            'BW': { destination: 'Various', depart_city: 'Burbank' },
            'CH': { destination: 'Various', depart_city: 'Chicago' },
            'CI': { destination: 'Various', depart_city: 'Cincinnati' },
            'CL': { destination: 'Various', depart_city: 'Cleveland' },
            'CM': { destination: 'Various', depart_city: 'Columbus' },
            'CV': { destination: 'Various', depart_city: 'Charlotte' },
            'DA': { destination: 'Various', depart_city: 'Dallas' },
            'DE': { destination: 'Various', depart_city: 'Denver' },
            'DT': { destination: 'Various', depart_city: 'Detroit' },
            'FT': { destination: 'Various', depart_city: 'Ft Lauderdale' },
            'HO': { destination: 'Various', depart_city: 'Houston' },
            'IN': { destination: 'Various', depart_city: 'Indianapolis' },
            'KC': { destination: 'Various', depart_city: 'Kansas City' },
            'LA': { destination: 'Various', depart_city: 'Los Angeles' },
            'LV': { destination: 'Various', depart_city: 'Las Vegas' },
            'ME': { destination: 'Various', depart_city: 'Memphis' },
            'MI': { destination: 'Various', depart_city: 'Miami' },
            'MW': { destination: 'Various', depart_city: 'Milwaukee' },
            'NA': { destination: 'Various', depart_city: 'Nashville' },
            'NO': { destination: 'Various', depart_city: 'New Orleans' },
            'NY': { destination: 'Various', depart_city: 'New York' },
            'OA': { destination: 'Various', depart_city: 'Oakland' },
            'OK': { destination: 'Various', depart_city: 'Oklahoma City' },
            'ON': { destination: 'Various', depart_city: 'Ontario' },
            'OR': { destination: 'Various', depart_city: 'Orlando' },
            'PH': { destination: 'Various', depart_city: 'Phoenix' },
            'PI': { destination: 'Various', depart_city: 'Pittsburgh' },
            'PO': { destination: 'Various', depart_city: 'Portland' },
            'RA': { destination: 'Various', depart_city: 'Raleigh' },
            'SA': { destination: 'Various', depart_city: 'San Antonio' },
            'SC': { destination: 'Various', depart_city: 'Sacramento' },
            'SD': { destination: 'Various', depart_city: 'San Diego' },
            'SE': { destination: 'Various', depart_city: 'Seattle' },
            'SF': { destination: 'Various', depart_city: 'San Francisco' },
            'SJ': { destination: 'Various', depart_city: 'San Jose' },
            'SL': { destination: 'Various', depart_city: 'Salt Lake City' },
            'ST': { destination: 'Various', depart_city: 'St Louis' },
            'TA': { destination: 'Various', depart_city: 'Tampa' },
            'TU': { destination: 'Various', depart_city: 'Tucson' },
            'WA': { destination: 'Various', depart_city: 'Washington DC' }
        }
    },

    // ==========================================================================
    // 2-NIGHT AIR + HOTEL - LAS VEGAS (CCPV city codes) - Mon/Tue/Wed
    // ==========================================================================
    {
        prefix: 'CCPV',
        package_type: '2-night-air-hotel',
        destinations: {
            'DW': { destination: 'Las Vegas', depart_city: 'Dallas' },
            'SM': { destination: 'Las Vegas', depart_city: 'Sacramento' },
            'SA': { destination: 'Las Vegas', depart_city: 'San Antonio' },
            'SF': { destination: 'Las Vegas', depart_city: 'San Francisco' },
            'SJ': { destination: 'Las Vegas', depart_city: 'San Jose' },
            'SL': { destination: 'Las Vegas', depart_city: 'Salt Lake City' },
            'SD': { destination: 'Las Vegas', depart_city: 'San Diego' },
            'SE': { destination: 'Las Vegas', depart_city: 'Seattle' },
            'PO': { destination: 'Las Vegas', depart_city: 'Portland' },
            'PH': { destination: 'Las Vegas', depart_city: 'Phoenix' },
            'DE': { destination: 'Las Vegas', depart_city: 'Denver' },
            'LA': { destination: 'Las Vegas', depart_city: 'Los Angeles' },
            'OA': { destination: 'Las Vegas', depart_city: 'Oakland' }
        }
    },

    // ==========================================================================
    // CRUISE - MEXICO (CCPV A/B/C/D series) - Specific dates from calendar
    // ==========================================================================
    {
        prefix: 'CCPVA',
        package_type: 'cruise-3-night',
        destinations: {
            // 3-night Mexico cruise
            'default': { destination: 'Mexico Cruise', depart_city: 'Long Beach' }
        }
    },
    {
        prefix: 'CCPVB',
        package_type: 'cruise-4-night',
        destinations: {
            'default': { destination: 'Mexico Cruise', depart_city: 'Long Beach' }
        }
    },
    {
        prefix: 'CCPVC',
        package_type: 'cruise-5-night',
        destinations: {
            'default': { destination: 'Mexico Cruise', depart_city: 'Long Beach' }
        }
    },
    {
        prefix: 'CCPVD',
        package_type: 'cruise-7-night',
        destinations: {
            'default': { destination: 'Mexico Cruise', depart_city: 'Long Beach' }
        }
    },

    // ==========================================================================
    // CRUISE + AIR (CDG) - Specific dates from calendar
    // ==========================================================================
    {
        prefix: 'CDGBB',
        package_type: 'cruise-air-4-night',
        destinations: {
            'default': { destination: 'Bahamas Cruise', depart_city: 'Various' }
        }
    },
    {
        prefix: 'CDGCB',
        package_type: 'cruise-air-4-night',
        destinations: {
            'default': { destination: 'Bahamas Cruise', depart_city: 'Various' }
        }
    },
    {
        prefix: 'CDGMD',
        package_type: 'cruise-air-4-night',
        destinations: {
            'default': { destination: 'Mexico Cruise', depart_city: 'Various' }
        }
    },
    {
        prefix: 'CDGMH',
        package_type: 'cruise-air-4-night',
        destinations: {
            'default': { destination: 'Mexico Cruise', depart_city: 'Various' }
        }
    },

    // ==========================================================================
    // BAHAMAS CRUISE (CBF, CJCB) - Specific dates from calendar
    // ==========================================================================
    {
        prefix: 'CBF',
        package_type: 'cruise-3-night',
        destinations: {
            'default': { destination: 'Bahamas Cruise', depart_city: 'Miami' }
        }
    },
    {
        prefix: 'CJCB',
        package_type: 'cruise-3-night',
        destinations: {
            'default': { destination: 'Bahamas Cruise', depart_city: 'Miami' }
        }
    },

    // ==========================================================================
    // CARIBBEAN CRUISE (CJCC) - Specific dates from calendar
    // ==========================================================================
    {
        prefix: 'CJCC',
        package_type: 'cruise-7-night',
        destinations: {
            'default': { destination: 'Caribbean Cruise', depart_city: 'Various' }
        }
    },

    // ==========================================================================
    // PICK 5 VACATION (CJ) - 2-night air, Mon/Tue/Wed
    // ==========================================================================
    {
        prefix: 'CJ',
        package_type: '2-night-air-hotel',
        destinations: {
            'LV': { destination: 'Las Vegas', depart_city: 'Various' },
            'OR': { destination: 'Orlando', depart_city: 'Various' },
            'SF': { destination: 'San Francisco', depart_city: 'Various' },
            'LC': { destination: 'Los Cabos', depart_city: 'Various' }
        }
    }
];

// =============================================================================
// AIR CALENDAR REGION MAPPING
// =============================================================================

/**
 * Maps destinations to Google Sheets calendar tabs
 * Used for 2-night and 3-night air packages
 */
const AIR_CALENDAR_REGIONS = {
    // Sheet 1: Las Vegas, Arizona, Colorado, Utah, Texas
    'Las Vegas': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'Phoenix': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'Denver': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'Salt Lake City': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'Austin': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'Dallas': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'Houston': 'Las Vegas, Arizona, Colorado, Utah, Texas',
    'San Antonio': 'Las Vegas, Arizona, Colorado, Utah, Texas',

    // Sheet 2: New Orleans, DC, New York, Illinois, Canada
    'New Orleans': 'New Orleans, Washington D.C. Area, New York, Illinois, Canada',
    'Washington DC': 'New Orleans, Washington D.C. Area, New York, Illinois, Canada',
    'New York': 'New Orleans, Washington D.C. Area, New York, Illinois, Canada',
    'Chicago': 'New Orleans, Washington D.C. Area, New York, Illinois, Canada',

    // Sheet 3: Hawaii & International (2026)
    'Hawaii': 'Hawaii & International (2026)',
    'Cancun': 'Hawaii & International (2026)',
    'Dominican Republic': 'Hawaii & International (2026)',
    'Los Cabos': 'Hawaii & International (2026)',
    'Puerto Vallarta': 'Hawaii & International (2026)',

    // Sheet 5: San Francisco, Reno, Napa, Washington, Oregon
    'San Francisco': 'San Francisco, Reno, Napa, Washington, Oregon',
    'Oakland': 'San Francisco, Reno, Napa, Washington, Oregon',
    'San Jose': 'San Francisco, Reno, Napa, Washington, Oregon',
    'Sacramento': 'San Francisco, Reno, Napa, Washington, Oregon',
    'Reno': 'San Francisco, Reno, Napa, Washington, Oregon',
    'Seattle': 'San Francisco, Reno, Napa, Washington, Oregon',
    'Portland': 'San Francisco, Reno, Napa, Washington, Oregon',

    // Sheet 6: Los Angeles, Anaheim, Florida, Orlando
    'Los Angeles': 'Los Angeles Area, Anaheim & Florida, Orlando',
    'Burbank': 'Los Angeles Area, Anaheim & Florida, Orlando',
    'Ontario': 'Los Angeles Area, Anaheim & Florida, Orlando',
    'Orlando': 'Los Angeles Area, Anaheim & Florida, Orlando',
    'Miami': 'Los Angeles Area, Anaheim & Florida, Orlando',
    'Tampa': 'Los Angeles Area, Anaheim & Florida, Orlando',
    'Ft Lauderdale': 'Los Angeles Area, Anaheim & Florida, Orlando',

    // Sheet 7: San Diego Area
    'San Diego': 'San Diego Area'
};

// =============================================================================
// GOOGLE SHEETS CALENDAR CONFIGURATION
// =============================================================================

const CALENDAR_SHEETS = {
    air: {
        spreadsheetId: '1d-3F9EFgEhHbo5Kwx1a5Hm16Et1DgEsqNwmCmhUae3c',
        baseUrl: 'https://docs.google.com/spreadsheets/d/1d-3F9EFgEhHbo5Kwx1a5Hm16Et1DgEsqNwmCmhUae3c/gviz/tq?tqx=out:csv'
    },
    cruise: {
        spreadsheetId: '16L5F5HZvl8XzSrpwFRNoPhAunDNijIBTmo3v0CCaWrU',
        baseUrl: 'https://docs.google.com/spreadsheets/d/16L5F5HZvl8XzSrpwFRNoPhAunDNijIBTmo3v0CCaWrU/gviz/tq?tqx=out:csv'
    }
};

// =============================================================================
// CRUISE CALENDAR - COMPLETE DATA
// =============================================================================

/**
 * Complete cruise calendar data organized by sheet (cruise type)
 * Each sheet has columns for: DEPARTURE_PORT DESTINATION NIGHTS
 * Format: "PORT, STATE DESTINATION X NIGHTS"
 */
const CRUISE_CALENDAR_DATA = {
    'Mexico Cruises': {
        sheetName: 'Mexico Cruises',
        options: [
            { port: 'Long Beach', state: 'CA', destination: 'Baja Mexico', nights: 3 },
            { port: 'Long Beach', state: 'CA', destination: 'Baja Mexico', nights: 4 },
            { port: 'Long Beach', state: 'CA', destination: 'Mexican Riviera', nights: 5 },
            { port: 'Long Beach', state: 'CA', destination: 'Mexican Riviera', nights: 6 },
            { port: 'Long Beach', state: 'CA', destination: 'Mexican Riviera', nights: 7 },
            { port: 'Long Beach', state: 'CA', destination: 'Mexican Riviera', nights: 8 },
            { port: 'San Pedro', state: 'CA', destination: 'Baja Mexico', nights: 3 },
            { port: 'San Pedro', state: 'CA', destination: 'Baja Mexico', nights: 4 },
            { port: 'San Pedro', state: 'CA', destination: 'Baja Mexico', nights: 5 },
            { port: 'San Pedro', state: 'CA', destination: 'Baja Mexico', nights: 7 },
            { port: 'San Pedro', state: 'CA', destination: 'Mexican Riviera', nights: 7 }
        ]
    },
    'Caribbean Cruises': {
        sheetName: 'Caribbean Cruises',
        options: [
            { port: 'San Juan', state: 'PR', destination: 'S. Caribbean', nights: 7 },
            { port: 'Miami', state: 'FL', destination: 'Bahamas', nights: 3 },
            { port: 'Miami', state: 'FL', destination: 'Caribbean', nights: 4 },
            { port: 'Miami', state: 'FL', destination: 'Bahamas', nights: 4 },
            { port: 'Miami', state: 'FL', destination: 'Caribbean', nights: 5 },
            { port: 'Miami', state: 'FL', destination: 'Caribbean', nights: 7 },
            { port: 'Ft. Lauderdale', state: 'FL', destination: 'Caribbean', nights: 5 },
            { port: 'Port Canaveral', state: 'FL', destination: 'E. Caribbean', nights: 4 },
            { port: 'Port Canaveral', state: 'FL', destination: 'E. Caribbean', nights: 5 },
            { port: 'Tampa', state: 'FL', destination: 'W. Caribbean', nights: 4 },
            { port: 'Tampa', state: 'FL', destination: 'W. Caribbean', nights: 5 },
            { port: 'New Orleans', state: 'LA', destination: 'W. Caribbean', nights: 4 },
            { port: 'New Orleans', state: 'LA', destination: 'W. Caribbean', nights: 5 },
            { port: 'New Orleans', state: 'LA', destination: 'W. Caribbean', nights: 7 },
            { port: 'Galveston', state: 'TX', destination: 'W. Caribbean', nights: 4 },
            { port: 'Galveston', state: 'TX', destination: 'W. Caribbean', nights: 5 },
            { port: 'Galveston', state: 'TX', destination: 'W. Caribbean', nights: 7 },
            { port: 'Mobile', state: 'AL', destination: 'W. Caribbean', nights: 4 }
        ]
    },
    'Bahamas Cruises': {
        sheetName: 'Bahamas Cruises',
        options: [
            { port: 'Port Canaveral', state: 'FL', destination: 'Bahamas', nights: 3 },
            { port: 'Port Canaveral', state: 'FL', destination: 'Bahamas', nights: 4 },
            { port: 'Miami', state: 'FL', destination: 'Bahamas', nights: 3 },
            { port: 'Miami', state: 'FL', destination: 'Bahamas', nights: 4 },
            { port: 'Jacksonville', state: 'FL', destination: 'Bahamas', nights: 4 },
            { port: 'Jacksonville', state: 'FL', destination: 'Bahamas', nights: 5 },
            { port: 'Tampa', state: 'FL', destination: 'Bahamas', nights: 4 },
            { port: 'Tampa', state: 'FL', destination: 'Bahamas', nights: 5 },
            { port: 'Charleston', state: 'SC', destination: 'Bahamas', nights: 4 },
            { port: 'Charleston', state: 'SC', destination: 'Bahamas', nights: 5 },
            { port: 'Baltimore', state: 'MD', destination: 'Bahamas', nights: 7 }
        ]
    },
    'Alaska Cruises': {
        sheetName: 'Alaska Cruises',
        options: [
            { port: 'Seattle', state: 'WA', destination: 'Alaska', nights: 7 }
        ]
    }
};

/**
 * Air calendar destinations
 */
const AIR_CALENDAR_DATA = {
    'Cancun': {
        sheetName: 'Cancun',
        packageTypes: ['MIW', 'MIG'],
        nights: [2, 3]
    },
    'Puerto Vallarta': {
        sheetName: 'Puerto Vallarta',
        packageTypes: ['MIW', 'MIG'],
        nights: [2, 3]
    },
    'Los Cabos': {
        sheetName: 'Los Cabos',
        packageTypes: ['MIW'],
        nights: [3]
    },
    'Dominican Republic': {
        sheetName: 'Dominican Republic',
        packageTypes: ['MIW'],
        nights: [3]
    },
    'Las Vegas': {
        sheetName: 'Las Vegas',
        packageTypes: ['DB', 'CCPV'],
        nights: [2]
    }
};

// Legacy mapping for backward compatibility
const CRUISE_CALENDAR_REGIONS = {
    'Mexico Cruise': 'Mexico Cruises',
    'Caribbean Cruise': 'Caribbean Cruises',
    'Bahamas Cruise': 'Bahamas Cruises',
    'Alaska Cruise': 'Alaska Cruises'
};

// =============================================================================
// CALENDAR DATE FETCH FUNCTIONS
// =============================================================================

const https = require('https');
const http = require('http');

/**
 * Fetch CSV data from Google Sheets
 * @param {string} sheetType - 'air' or 'cruise'
 * @param {string} sheetName - Name of the sheet tab
 * @returns {Promise<string>} CSV data
 */
async function fetchSheetCSV(sheetType, sheetName) {
    const config = CALENDAR_SHEETS[sheetType];
    if (!config) throw new Error(`Unknown sheet type: ${sheetType}`);

    const url = `${config.baseUrl}&sheet=${encodeURIComponent(sheetName)}`;

    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        client.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        }, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                client.get(res.headers.location, (res2) => {
                    let data = '';
                    res2.on('data', chunk => data += chunk);
                    res2.on('end', () => resolve(data));
                }).on('error', reject);
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Parse CSV row into array
 * @param {string} row - CSV row
 * @returns {string[]} Array of values
 */
function parseCSVRow(row) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

/**
 * Parse month-year string to date components
 * @param {string} monthYear - e.g., "Jan-26", "Feb-26"
 * @returns {object} { month, year }
 */
function parseMonthYear(monthYear) {
    const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const match = monthYear.match(/([a-zA-Z]+)[,-]?\s*(\d{2,4})/);
    if (!match) return null;

    const monthStr = match[1].toLowerCase().substring(0, 3);
    let year = parseInt(match[2]);
    if (year < 100) year += 2000; // Convert 26 to 2026

    return { month: months[monthStr], year };
}

/**
 * Parse date numbers from a cell value
 * @param {string} cellValue - e.g., "4, 8, 18, 22, 29" or "N/A"
 * @returns {number[]} Array of day numbers
 */
function parseDateNumbers(cellValue) {
    if (!cellValue || cellValue.trim().toUpperCase() === 'N/A' || cellValue.trim() === '') {
        return [];
    }

    // Extract all numbers from the cell
    const numbers = cellValue.match(/\d+/g);
    return numbers ? numbers.map(n => parseInt(n)) : [];
}

/**
 * Fetch available cruise dates for a specific cruise option
 * @param {string} cruiseType - e.g., 'Mexico Cruises', 'Caribbean Cruises'
 * @param {string} port - Departure port
 * @param {string} destination - Cruise destination
 * @param {number} nights - Number of nights
 * @returns {Promise<object>} Available dates
 */
async function fetchCruiseDates(cruiseType, port, destination, nights) {
    const cruiseData = CRUISE_CALENDAR_DATA[cruiseType];
    if (!cruiseData) {
        return { error: `Unknown cruise type: ${cruiseType}` };
    }

    try {
        const csvData = await fetchSheetCSV('cruise', cruiseData.sheetName);
        const rows = csvData.split('\n').filter(r => r.trim());

        if (rows.length < 2) {
            return { error: 'No data found in sheet' };
        }

        // Parse header row to find the column for this cruise option
        const headers = parseCSVRow(rows[0]);

        // Build search pattern: "PORT, STATE DESTINATION X NIGHTS"
        const searchPattern = `${port.toUpperCase()}, ${destination.toUpperCase()} ${nights} NIGHT`;
        const searchPatternAlt = `${port.toUpperCase()},${destination.toUpperCase()} ${nights} NIGHT`;

        // Find column index
        let columnIndex = -1;
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].toUpperCase();
            if (header.includes(searchPattern) || header.includes(searchPatternAlt)) {
                columnIndex = i;
                break;
            }
        }

        // If not found, try more flexible matching
        if (columnIndex === -1) {
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i].toUpperCase();
                if (header.includes(port.toUpperCase()) &&
                    header.includes(destination.toUpperCase()) &&
                    header.includes(`${nights} NIGHT`)) {
                    columnIndex = i;
                    break;
                }
            }
        }

        if (columnIndex === -1) {
            return {
                error: 'Cruise option not found',
                searched_for: `${port} ${destination} ${nights} nights`,
                available_columns: headers.filter(h => h.trim()).slice(0, 10)
            };
        }

        // Parse dates from each row
        const availableDates = [];

        for (let i = 1; i < rows.length; i++) {
            const rowValues = parseCSVRow(rows[i]);

            // Month-year is typically in the column before the dates (even columns are months, odd are dates)
            // Or it might be in the same pattern as the header
            const monthYearCol = columnIndex % 2 === 0 ? columnIndex : columnIndex - 1;
            const monthYearStr = rowValues[monthYearCol];
            const datesStr = rowValues[columnIndex % 2 === 0 ? columnIndex + 1 : columnIndex];

            // Try to get month/year from the row
            let monthYear = parseMonthYear(monthYearStr);
            if (!monthYear && rowValues[0]) {
                monthYear = parseMonthYear(rowValues[0]);
            }

            if (!monthYear) continue;

            // Get the dates from the correct column
            const dateCell = rowValues[columnIndex];
            const days = parseDateNumbers(dateCell);

            for (const day of days) {
                const date = new Date(monthYear.year, monthYear.month, day);
                if (date >= new Date()) { // Only future dates
                    availableDates.push({
                        date: date.toISOString().split('T')[0],
                        day: day,
                        month: monthYear.month + 1,
                        year: monthYear.year,
                        formatted: date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })
                    });
                }
            }
        }

        // Sort by date
        availableDates.sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            cruise_type: cruiseType,
            port: port,
            destination: destination,
            nights: nights,
            total_dates: availableDates.length,
            dates: availableDates
        };

    } catch (error) {
        return { error: `Failed to fetch cruise dates: ${error.message}` };
    }
}

/**
 * Get all cruise options for a port
 * @param {string} port - Departure port name
 * @returns {object[]} Available cruise options from this port
 */
function getCruiseOptionsForPort(port) {
    const options = [];
    const portLower = port.toLowerCase();

    for (const [cruiseType, data] of Object.entries(CRUISE_CALENDAR_DATA)) {
        for (const option of data.options) {
            if (option.port.toLowerCase().includes(portLower) ||
                portLower.includes(option.port.toLowerCase())) {
                options.push({
                    cruise_type: cruiseType,
                    ...option,
                    full_port: `${option.port}, ${option.state}`
                });
            }
        }
    }

    return options;
}

/**
 * Get all unique cruise departure ports
 * @returns {string[]} List of unique ports
 */
function getAllCruisePorts() {
    const ports = new Set();

    for (const data of Object.values(CRUISE_CALENDAR_DATA)) {
        for (const option of data.options) {
            ports.add(`${option.port}, ${option.state}`);
        }
    }

    return Array.from(ports).sort();
}

/**
 * Get all cruise options grouped by type
 * @returns {object} Cruise options by type
 */
function getAllCruiseOptions() {
    const result = {};

    for (const [cruiseType, data] of Object.entries(CRUISE_CALENDAR_DATA)) {
        result[cruiseType] = {
            sheet: data.sheetName,
            options: data.options.map(o => ({
                ...o,
                full_name: `${o.port}, ${o.state} - ${o.destination} ${o.nights} Nights`
            }))
        };
    }

    return result;
}

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Look up package type details by pkg_code2
 * @param {string} pkgCode2 - The full package code (e.g., "MIWCA", "DBLA")
 * @returns {object} Package type details or null if not found
 */
function lookupPackageType(pkgCode2) {
    if (!pkgCode2) return null;

    const code = pkgCode2.toUpperCase().trim();

    // Sort prefixes by length (longest first) to match most specific first
    const sortedMappings = [...PREFIX_MAPPINGS].sort((a, b) => b.prefix.length - a.prefix.length);

    for (const mapping of sortedMappings) {
        if (code.startsWith(mapping.prefix)) {
            const suffix = code.substring(mapping.prefix.length);
            const packageTypeDetails = PACKAGE_TYPES[mapping.package_type];

            // Try to find destination by suffix, fall back to 'default'
            let destinationInfo = mapping.destinations[suffix] || mapping.destinations['default'];

            // If no match found, try partial suffix matching
            if (!destinationInfo) {
                // Try first 2 chars of suffix
                if (suffix.length >= 2) {
                    destinationInfo = mapping.destinations[suffix.substring(0, 2)];
                }
            }

            if (!destinationInfo) {
                destinationInfo = { destination: 'Unknown', depart_city: 'Unknown' };
            }

            // Get calendar region
            let calendar_region = null;
            if (packageTypeDetails.calendar_type === 'air') {
                calendar_region = AIR_CALENDAR_REGIONS[destinationInfo.destination] ||
                                  AIR_CALENDAR_REGIONS[destinationInfo.depart_city];
            } else if (packageTypeDetails.calendar_type === 'cruise') {
                calendar_region = CRUISE_CALENDAR_REGIONS[destinationInfo.destination];
            }

            return {
                pkg_code2: code,
                prefix: mapping.prefix,
                suffix: suffix,
                package_type: mapping.package_type,
                ...packageTypeDetails,
                destination: destinationInfo.destination,
                depart_city: destinationInfo.depart_city,
                calendar_region: calendar_region,
                scheduling_rules: {
                    calendar_type: packageTypeDetails.calendar_type,
                    nights: packageTypeDetails.nights,
                    allowed_departure_days: packageTypeDetails.departure_rules.allowed_days,
                    allowed_day_numbers: packageTypeDetails.departure_rules.day_numbers,
                    use_air_calendar: packageTypeDetails.calendar_type === 'air',
                    use_cruise_calendar: packageTypeDetails.calendar_type === 'cruise'
                }
            };
        }
    }

    return null;
}

/**
 * Check if a date is valid for a package type
 * @param {string} pkgCode2 - Package code
 * @param {Date|string} date - Date to check
 * @returns {object} Validation result
 */
function isValidDepartureDate(pkgCode2, date) {
    const packageInfo = lookupPackageType(pkgCode2);

    if (!packageInfo) {
        return {
            valid: false,
            reason: 'Unknown package code',
            pkg_code2: pkgCode2
        };
    }

    // If cruise, we can't validate day of week - need to check cruise calendar
    if (packageInfo.calendar_type === 'cruise') {
        return {
            valid: null, // Need to check cruise calendar
            reason: 'Requires cruise calendar lookup',
            pkg_code2: pkgCode2,
            package_type: packageInfo.package_type,
            calendar_region: packageInfo.calendar_region
        };
    }

    // For air packages, check day of week
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = checkDate.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

    const isAllowedDay = packageInfo.scheduling_rules.allowed_day_numbers.includes(dayOfWeek);

    return {
        valid: isAllowedDay,
        date: checkDate.toISOString().split('T')[0],
        day_of_week: dayName,
        day_number: dayOfWeek,
        allowed_days: packageInfo.scheduling_rules.allowed_departure_days,
        reason: isAllowedDay
            ? `${dayName} is a valid departure day for this package`
            : `${dayName} is not allowed. This package requires: ${packageInfo.scheduling_rules.allowed_departure_days.join(', ')}`,
        pkg_code2: pkgCode2,
        package_type: packageInfo.package_type,
        nights: packageInfo.nights
    };
}

/**
 * Get next valid departure dates for a package
 * @param {string} pkgCode2 - Package code
 * @param {number} count - Number of dates to return (default 5)
 * @param {Date} startFrom - Start date (default today)
 * @returns {array} Array of valid dates
 */
function getNextValidDates(pkgCode2, count = 5, startFrom = new Date()) {
    const packageInfo = lookupPackageType(pkgCode2);

    if (!packageInfo) {
        return { error: 'Unknown package code', pkg_code2: pkgCode2 };
    }

    // For cruise packages, return info about needing calendar lookup
    if (packageInfo.calendar_type === 'cruise') {
        return {
            pkg_code2: pkgCode2,
            package_type: packageInfo.package_type,
            calendar_type: 'cruise',
            message: 'Cruise dates must be looked up from cruise calendar',
            calendar_region: packageInfo.calendar_region,
            destination: packageInfo.destination
        };
    }

    // For air packages, calculate next valid dates
    const validDates = [];
    const currentDate = new Date(startFrom);
    currentDate.setHours(0, 0, 0, 0);

    // Skip today if it's already past business hours
    const now = new Date();
    if (currentDate.toDateString() === now.toDateString() && now.getHours() >= 17) {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    while (validDates.length < count) {
        const dayOfWeek = currentDate.getDay();

        if (packageInfo.scheduling_rules.allowed_day_numbers.includes(dayOfWeek)) {
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
            validDates.push({
                date: currentDate.toISOString().split('T')[0],
                day_of_week: dayName,
                formatted: currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        pkg_code2: pkgCode2,
        package_type: packageInfo.package_type,
        nights: packageInfo.nights,
        destination: packageInfo.destination,
        depart_city: packageInfo.depart_city,
        calendar_region: packageInfo.calendar_region,
        allowed_departure_days: packageInfo.scheduling_rules.allowed_departure_days,
        next_valid_dates: validDates,
        note: `These dates are valid based on departure day rules. Check air calendar (${packageInfo.calendar_region}) for actual availability.`
    };
}

// =============================================================================
// EXPRESS ROUTER
// =============================================================================

const express = require('express');
const router = express.Router();

/**
 * GET /api/package-type
 * Look up package type by pkg_code2
 *
 * Query params:
 * - pkg_code2: The package code to look up (required)
 *
 * Response:
 * - Package type details including scheduling rules
 */
router.get('/package-type', (req, res) => {
    const { pkg_code2 } = req.query;

    if (!pkg_code2) {
        return res.status(400).json({
            error: 'Missing required parameter: pkg_code2',
            example: '/api/package-type?pkg_code2=MIWCA'
        });
    }

    const result = lookupPackageType(pkg_code2);

    if (!result) {
        return res.status(404).json({
            error: 'Package code not found',
            pkg_code2: pkg_code2,
            message: 'This package code prefix is not in our system'
        });
    }

    res.json(result);
});

/**
 * GET /api/package-type/validate-date
 * Check if a date is valid for a package type
 *
 * Query params:
 * - pkg_code2: The package code (required)
 * - date: Date to validate in YYYY-MM-DD format (required)
 */
router.get('/package-type/validate-date', (req, res) => {
    const { pkg_code2, date } = req.query;

    if (!pkg_code2 || !date) {
        return res.status(400).json({
            error: 'Missing required parameters',
            required: ['pkg_code2', 'date'],
            example: '/api/package-type/validate-date?pkg_code2=MIWCA&date=2026-03-15'
        });
    }

    const result = isValidDepartureDate(pkg_code2, date);
    res.json(result);
});

/**
 * GET /api/package-type/next-dates
 * Get next valid departure dates for a package
 *
 * Query params:
 * - pkg_code2: The package code (required)
 * - count: Number of dates to return (default 5)
 * - start_date: Start date in YYYY-MM-DD format (default today)
 */
router.get('/package-type/next-dates', (req, res) => {
    const { pkg_code2, count = 5, start_date } = req.query;

    if (!pkg_code2) {
        return res.status(400).json({
            error: 'Missing required parameter: pkg_code2',
            example: '/api/package-type/next-dates?pkg_code2=MIWCA&count=5'
        });
    }

    const startFrom = start_date ? new Date(start_date) : new Date();
    const result = getNextValidDates(pkg_code2, parseInt(count), startFrom);

    if (result.error) {
        return res.status(404).json(result);
    }

    res.json(result);
});

/**
 * GET /api/package-type/list
 * List all package type prefixes and their rules
 */
router.get('/package-type/list', (req, res) => {
    const summary = PREFIX_MAPPINGS.map(mapping => {
        const typeDetails = PACKAGE_TYPES[mapping.package_type];
        return {
            prefix: mapping.prefix,
            package_type: mapping.package_type,
            nights: typeDetails.nights,
            calendar_type: typeDetails.calendar_type,
            departure_days: typeDetails.departure_rules.allowed_days,
            description: typeDetails.description
        };
    });

    res.json({
        total_prefixes: summary.length,
        package_types: Object.keys(PACKAGE_TYPES),
        prefixes: summary
    });
});

// =============================================================================
// CRUISE CALENDAR ENDPOINTS
// =============================================================================

/**
 * GET /api/cruise/ports
 * Get all cruise departure ports
 */
router.get('/cruise/ports', (req, res) => {
    const ports = getAllCruisePorts();
    res.json({
        total: ports.length,
        ports: ports
    });
});

/**
 * GET /api/cruise/options
 * Get all cruise options grouped by cruise type
 *
 * Query params (optional):
 * - port: Filter by departure port
 */
router.get('/cruise/options', (req, res) => {
    const { port } = req.query;

    if (port) {
        const options = getCruiseOptionsForPort(port);
        if (options.length === 0) {
            return res.status(404).json({
                error: 'No cruise options found for this port',
                port: port,
                available_ports: getAllCruisePorts()
            });
        }
        return res.json({
            port: port,
            total: options.length,
            options: options
        });
    }

    res.json(getAllCruiseOptions());
});

/**
 * GET /api/cruise/dates
 * Get available dates for a specific cruise
 *
 * Query params:
 * - cruise_type: e.g., "Mexico Cruises", "Caribbean Cruises" (required)
 * - port: Departure port (required)
 * - destination: Cruise destination (required)
 * - nights: Number of nights (required)
 */
router.get('/cruise/dates', async (req, res) => {
    const { cruise_type, port, destination, nights } = req.query;

    if (!cruise_type || !port || !destination || !nights) {
        return res.status(400).json({
            error: 'Missing required parameters',
            required: ['cruise_type', 'port', 'destination', 'nights'],
            example: '/api/cruise/dates?cruise_type=Mexico%20Cruises&port=Long%20Beach&destination=Baja%20Mexico&nights=3',
            available_cruise_types: Object.keys(CRUISE_CALENDAR_DATA)
        });
    }

    const result = await fetchCruiseDates(cruise_type, port, destination, parseInt(nights));

    if (result.error) {
        return res.status(404).json(result);
    }

    res.json(result);
});

/**
 * GET /api/cruise/dates/by-port
 * Get all available cruise dates from a specific port
 *
 * Query params:
 * - port: Departure port (required)
 * - nights: Filter by nights (optional)
 */
router.get('/cruise/dates/by-port', async (req, res) => {
    const { port, nights } = req.query;

    if (!port) {
        return res.status(400).json({
            error: 'Missing required parameter: port',
            example: '/api/cruise/dates/by-port?port=Miami',
            available_ports: getAllCruisePorts()
        });
    }

    let options = getCruiseOptionsForPort(port);

    if (options.length === 0) {
        return res.status(404).json({
            error: 'No cruise options found for this port',
            port: port,
            available_ports: getAllCruisePorts()
        });
    }

    // Filter by nights if specified
    if (nights) {
        options = options.filter(o => o.nights === parseInt(nights));
    }

    // Fetch dates for each option
    const results = [];
    for (const option of options) {
        const dates = await fetchCruiseDates(
            option.cruise_type,
            option.port,
            option.destination,
            option.nights
        );
        results.push({
            option: `${option.destination} ${option.nights} Nights`,
            cruise_type: option.cruise_type,
            ...dates
        });
    }

    res.json({
        port: port,
        nights_filter: nights || 'all',
        total_options: results.length,
        cruises: results
    });
});

/**
 * GET /api/air/destinations
 * Get all air calendar destinations
 */
router.get('/air/destinations', (req, res) => {
    const destinations = Object.entries(AIR_CALENDAR_DATA).map(([name, data]) => ({
        destination: name,
        sheet: data.sheetName,
        package_types: data.packageTypes,
        nights: data.nights
    }));

    res.json({
        total: destinations.length,
        destinations: destinations
    });
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    router,
    lookupPackageType,
    isValidDepartureDate,
    getNextValidDates,
    fetchCruiseDates,
    getCruiseOptionsForPort,
    getAllCruisePorts,
    getAllCruiseOptions,
    PACKAGE_TYPES,
    PREFIX_MAPPINGS,
    AIR_CALENDAR_REGIONS,
    CRUISE_CALENDAR_REGIONS,
    CRUISE_CALENDAR_DATA,
    AIR_CALENDAR_DATA,
    CALENDAR_SHEETS
};
