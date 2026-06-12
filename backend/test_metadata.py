import httpx

url = (
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?"
    "query=select+column_name,datatype+from+tap_schema.columns+where+table_name='cumulative'"
    "&format=json"
)

try:
    print("Sending request...")
    response = httpx.get(url, timeout=30.0)
    print("Status code:", response.status_code)
    if response.status_code == 200:
        cols = response.json()
        print("Columns in cumulative:")
        for c in cols[:30]:
            print(f"  {c['column_name']}: {c['datatype']}")
        print(f"... total {len(cols)} columns")
    else:
        print("Response text:", response.text[:500])
except Exception as e:
    print("Error:", e)
