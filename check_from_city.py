#!/usr/bin/env python3
"""Check from_city values in rims_data for missing packages"""

import requests
from collections import Counter

# Caspio credentials
CLIENT_ID = "66e0b1c620d74295c97e40374ab9d511c226e4f739725cdc8a"
CLIENT_SECRET = "5887478fd13240aca74f9999f6b4d7ad5f6cd48cbaff57e3ab"
BASE_URL = "https://***REMOVED***.caspio.com"

def get_token():
    url = f"{BASE_URL}/oauth/token"
    data = {"grant_type": "client_credentials", "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}
    resp = requests.post(url, data=data)
    return resp.json()["access_token"]

# Sample packages to check from_city
SAMPLE_CODES = [
    # Cruise packages
    "CCAGAF", "CCAHMS", "CCPBF", "CFCBF",
    # Air packages
    "TBODE", "TVLA", "VGNY", "VUDAN", "VULHN",
    # Hotel packages
    "LXV", "SXV", "LMVO"
]

def main():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    all_from_cities = Counter()

    for pkg in SAMPLE_CODES:
        url = f"{BASE_URL}/rest/v2/tables/rims_data/records"
        params = {
            "q.select": "pkg_code2,from_city,dest,val_file_type",
            "q.where": f"pkg_code2='{pkg}'",
            "q.limit": "100"
        }

        resp = requests.get(url, headers=headers, params=params, timeout=60)
        data = resp.json()

        if isinstance(data, dict) and "Result" in data:
            records = data["Result"]
            from_cities = Counter()
            for r in records:
                fc = r.get("from_city", "")
                if fc:
                    from_cities[fc.strip()] += 1
                    all_from_cities[fc.strip()] += 1

            print(f"{pkg}: {len(records)} records")
            if from_cities:
                print(f"  from_city values: {dict(from_cities)}")
            else:
                print(f"  NO from_city values found")
            print()

    print("\n=== ALL from_city values found ===")
    for fc, count in all_from_cities.most_common():
        print(f"  {fc}: {count}")

if __name__ == "__main__":
    main()
