import requests
import random
import json
import time

print("Fetching bridge data from OpenStreetMap (Overpass API)...")

# Overpass API query for major bridges in India
# We filter by highway=motorway/trunk/primary to get significant bridges
query = """
[out:json][timeout:90];
area["ISO3166-1"="IN"]->.searchArea;
(
  way["bridge"="yes"]["highway"~"motorway|trunk|primary"](area.searchArea);
);
out center 500;
"""

url = "http://overpass-api.de/api/interpreter"
try:
    headers = {
        'User-Agent': 'TruthBridge/1.0',
        'Accept': '*/*'
    }
    response = requests.post(url, data={'data': query}, headers=headers)
    response.raise_for_status()
    data = response.json()
except Exception as e:
    print(f"Error fetching data: {e}")
    exit(1)

elements = data.get('elements', [])
print(f"Successfully fetched {len(elements)} major bridges. Generating SQL...")

bridge_types = ["RCC Slab", "PSC Girder", "Steel Composite", "Suspension", "Cable-stayed", "Arch"]
materials = ["Reinforced Concrete", "Pre-stressed Concrete", "Steel", "Steel + Concrete"]
authorities = ["NHAI", "State PWD", "MoRTH"]
seismic_zones = ["II", "III", "IV", "V"]

sql_lines = [
    "-- ============================================================",
    "-- TruthBridge — Nationwide India Bridges Seed Data",
    "-- Fetched dynamically from OpenStreetMap",
    "-- ============================================================",
    "",
    "INSERT INTO bridges (",
    "  name, lat, lng, state, district, year_built, bridge_type, ",
    "  material, responsible_authority, length_m, seismic_zone, ",
    "  status, risk_score, risk_breakdown",
    ") VALUES"
]

values = []

for idx, element in enumerate(elements):
    tags = element.get('tags', {})
    
    # Try to get a meaningful name
    name = tags.get('name', '')
    if not name:
        ref = tags.get('ref', '')
        hw = tags.get('highway', 'highway')
        name = f"{ref} Bridge" if ref else f"Unnamed {hw.title()} Bridge"
        
    # Clean up name for SQL
    name = name.replace("'", "''")
    
    lat = element.get('center', {}).get('lat')
    lng = element.get('center', {}).get('lon')
    
    if not lat or not lng:
        continue
        
    # Generate realistic pseudo-data for the structural properties
    year_built = random.randint(1970, 2022)
    b_type = random.choice(bridge_types)
    material = random.choice(materials)
    auth = random.choice(authorities)
    length = round(random.uniform(30, 800), 2)
    sz = random.choice(seismic_zones)
    
    # Calculate a realistic risk score breakdown
    age = 2026 - year_built
    age_factor = min(25, max(3, int(age * 0.4)))
    monsoon_risk = random.randint(5, 20)
    seismic_factor = {"II": 2, "III": 5, "IV": 7, "V": 9}.get(sz, 5)
    inspection_gap = random.randint(0, 20)
    citizen_reports = 0 # No reports initially for seeded data
    
    score = age_factor + monsoon_risk + seismic_factor + inspection_gap
    
    status = "SAFE"
    if score >= 81: status = "CRITICAL"
    elif score >= 61: status = "WARNING"
    elif score >= 31: status = "MONITOR"
    
    breakdown = {
        "age_factor": age_factor,
        "monsoon_risk": monsoon_risk,
        "seismic_zone": seismic_factor,
        "inspection_gap": inspection_gap,
        "citizen_reports": citizen_reports
    }
    breakdown_json = json.dumps(breakdown).replace("'", "''")
    
    # For state/district, we'll use a placeholder since reverse geocoding 500 points is too slow
    # In a real pipeline, PostGIS would map lat/lng to state polygons automatically
    state = "India"
    district = "Various"
    
    val = f"  ('{name}', {lat}, {lng}, '{state}', '{district}', {year_built}, '{b_type}', '{material}', '{auth}', {length}, '{sz}', '{status}', {score}, '{breakdown_json}')"
    values.append(val)

sql_lines.append(",\n".join(values) + ";\n")

output_path = "supabase/migrations/00007_india_bridges_seed.sql"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Done! Generated {output_path} with {len(values)} bridges.")
