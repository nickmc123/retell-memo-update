#!/usr/bin/env python3
"""Check depart_city values in destSel table"""

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

def main():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Query destSel for all unique depart_city values
    url = f"{BASE_URL}/rest/v2/tables/destSel/records"

    all_depart_cities = Counter()
    page = 1

    while True:
        params = {
            "q.select": "depart_city,pkgCode2,vacation_type",
            "q.pageSize": "1000",
            "q.pageNumber": str(page)
        }

        resp = requests.get(url, headers=headers, params=params, timeout=60)
        data = resp.json()

        if isinstance(data, dict) and "Result" in data:
            records = data["Result"]
            if not records:
                break

            for r in records:
                dc = r.get("depart_city", "")
                if dc:
                    all_depart_cities[dc.strip()] += 1

            page += 1
            if len(records) < 1000:
                break
        else:
            break

    print("=== All depart_city values in destSel ===\n")
    for dc, count in sorted(all_depart_cities.items()):
        print(f"  {dc}: {count}")

    print(f"\nTotal unique depart_city values: {len(all_depart_cities)}")

if __name__ == "__main__":
    main()
