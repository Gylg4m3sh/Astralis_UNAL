import httpx

url = (
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?"
    "query=select+top+1+*+from+cumulative"
    "&format=json"
)

try:
    print("Sending request...")
    response = httpx.get(url, timeout=30.0)
    print("Status code:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        if len(data) > 0:
            print("Keys in row:")
            for k in sorted(data[0].keys()):
                print(f"  {k}")
        else:
            print("No rows returned")
    else:
        print("Response text:", response.text[:500])
except Exception as e:
    print("Error:", e)
