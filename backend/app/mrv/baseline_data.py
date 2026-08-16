"""
ZeroTrace Baseline Reference Datasets
Contains official CEA (Central Electricity Authority) and MNRE (Ministry of New and Renewable Energy)
regional baseline benchmarks for renewable energy capacity factors, grid emission factors, and typical
clear-sky diurnal solar irradiation curves.
"""

# Regional Grid Emission Baseline Factors (tCO2 / MWh) - CEA Version 19 / 2026
REGIONAL_GRID_EMISSION_FACTORS = {
    "NATIONAL_GRID_INDIA": 0.716,
    "NORTHERN_REGION": 0.728,
    "WESTERN_REGION": 0.765,
    "SOUTHERN_REGION": 0.684,
    "EASTERN_REGION": 0.812,
    "NORTH_EASTERN": 0.540,
    "US_PJM_INTERCONNECTION": 0.385,
    "EU_AVERAGE": 0.230,
}

# Regional Standard Solar Capacity Utilization Factors (CUF)
REGIONAL_CUF_BENCHMARKS = {
    "RAJASTHAN_DESERT": {"expected_cuf": 0.245, "min_cuf": 0.18, "max_cuf": 0.29},
    "GUJARAT_SOLAR": {"expected_cuf": 0.230, "min_cuf": 0.17, "max_cuf": 0.27},
    "KARNATAKA_SOLAR": {"expected_cuf": 0.215, "min_cuf": 0.16, "max_cuf": 0.26},
    "TAMIL_NADU_SOLAR": {"expected_cuf": 0.210, "min_cuf": 0.15, "max_cuf": 0.25},
    "MAHARASHTRA_SOLAR": {"expected_cuf": 0.205, "min_cuf": 0.15, "max_cuf": 0.25},
    "MADHYA_PRADESH_SOLAR": {"expected_cuf": 0.228, "min_cuf": 0.16, "max_cuf": 0.27},
    "DEFAULT_SOLAR": {"expected_cuf": 0.220, "min_cuf": 0.15, "max_cuf": 0.28},
}

# Standard Diurnal Solar Irradiance Profile (Hourly GHI factor 0 to 1 relative to peak)
DIURNAL_SOLAR_CURVE = {
    0: 0.00, 1: 0.00, 2: 0.00, 3: 0.00, 4: 0.00, 5: 0.02,
    6: 0.12, 7: 0.35, 8: 0.60, 9: 0.80, 10: 0.94, 11: 1.00,
    12: 0.98, 13: 0.92, 14: 0.78, 15: 0.58, 16: 0.32, 17: 0.10,
    18: 0.01, 19: 0.00, 20: 0.00, 21: 0.00, 22: 0.00, 23: 0.00,
}

def get_region_benchmark(location_name: str) -> dict:
    location_upper = location_name.upper()
    if "RAJASTHAN" in location_upper or "BHADLA" in location_upper:
        return REGIONAL_CUF_BENCHMARKS["RAJASTHAN_DESERT"]
    elif "GUJARAT" in location_upper or "CHARANKA" in location_upper:
        return REGIONAL_CUF_BENCHMARKS["GUJARAT_SOLAR"]
    elif "KARNATAKA" in location_upper or "PAVAGADA" in location_upper:
        return REGIONAL_CUF_BENCHMARKS["KARNATAKA_SOLAR"]
    elif "MADHYA" in location_upper or "REWA" in location_upper:
        return REGIONAL_CUF_BENCHMARKS["MADHYA_PRADESH_SOLAR"]
    elif "TAMIL" in location_upper or "KAMUTHI" in location_upper:
        return REGIONAL_CUF_BENCHMARKS["TAMIL_NADU_SOLAR"]
    return REGIONAL_CUF_BENCHMARKS["DEFAULT_SOLAR"]
