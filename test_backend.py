import json
from app import app

def run_tests():
    client = app.test_client()

    print("--- 1. Testing Health Check ---")
    res = client.get('/health')
    print("Health check status:", res.status_code, res.get_json())
    assert res.status_code == 200

    print("\n--- 2. Testing Current Weather ---")
    # Valid
    res = client.get('/api/weather/current?city=Vijayawada&country=IN')
    print("Valid city:", res.status_code, res.get_json().get('name'))
    assert res.status_code == 200

    # Missing city
    res = client.get('/api/weather/current')
    print("Missing city:", res.status_code, res.get_json())
    assert res.status_code == 400

    # Invalid city
    res = client.get('/api/weather/current?city=invalid_city_test_404')
    print("Invalid city:", res.status_code, res.get_json())
    assert res.status_code == 404

    print("\n--- 3. Testing 5-Day Forecast ---")
    # Valid
    res = client.get('/api/weather/forecast?city=Vijayawada&country=IN')
    print("Valid forecast:", res.status_code, f"Items: {len(res.get_json().get('list', []))}")
    assert res.status_code == 200

    # Invalid
    res = client.get('/api/weather/forecast?city=invalid_city_test_404')
    print("Invalid forecast city:", res.status_code, res.get_json())
    assert res.status_code == 404

    print("\n--- 4. Testing Favorites CRUD ---")
    # Clear any existing Vijayawada / Hyderabad test items
    res = client.get('/api/favorites')
    for fav in res.get_json():
        if fav['city'] in ['Vijayawada', 'Hyderabad']:
            client.delete(f"/api/favorites/{fav['id']}")

    # Create favorite
    res = client.post('/api/favorites', json={'city': 'Vijayawada', 'country': 'IN', 'nickname': 'My City'})
    print("Create favorite:", res.status_code, res.get_json())
    assert res.status_code == 201
    fav_id = res.get_json()['id']

    # Duplicate favorite test
    res_dup = client.post('/api/favorites', json={'city': 'Vijayawada', 'country': 'IN'})
    print("Duplicate favorite:", res_dup.status_code, res_dup.get_json())
    assert res_dup.status_code == 409

    # Missing fields test
    res_missing = client.post('/api/favorites', json={'city': 'Vijayawada'})
    print("Missing fields:", res_missing.status_code, res_missing.get_json())
    assert res_missing.status_code == 400

    # Read all
    res_all = client.get('/api/favorites')
    print("Read all:", res_all.status_code, f"Count: {len(res_all.get_json())}")
    assert res_all.status_code == 200

    # Read single
    res_single = client.get(f"/api/favorites/{fav_id}")
    print("Read single:", res_single.status_code, res_single.get_json().get('city'))
    assert res_single.status_code == 200

    # Read non-existent
    res_nonexistent = client.get("/api/favorites/999999")
    print("Read non-existent:", res_nonexistent.status_code, res_nonexistent.get_json())
    assert res_nonexistent.status_code == 404

    # Update
    res_update = client.put(f"/api/favorites/{fav_id}", json={'city': 'Vijayawada', 'country': 'IN', 'nickname': 'Smart City'})
    print("Update favorite:", res_update.status_code, res_update.get_json())
    assert res_update.status_code == 200
    assert res_update.get_json()['nickname'] == 'Smart City'

    # Update non-existent
    res_up_404 = client.put("/api/favorites/999999", json={'city': 'Mumbai', 'country': 'IN'})
    print("Update non-existent:", res_up_404.status_code, res_up_404.get_json())
    assert res_up_404.status_code == 404

    # Delete
    res_del = client.delete(f"/api/favorites/{fav_id}")
    print("Delete favorite:", res_del.status_code, res_del.get_json())
    assert res_del.status_code == 200

    # Delete non-existent
    res_del_404 = client.delete(f"/api/favorites/{fav_id}")
    print("Delete non-existent:", res_del_404.status_code, res_del_404.get_json())
    assert res_del_404.status_code == 404

    print("\n==========================================")
    print(" ALL BACKEND API TESTS COMPLETED AND PASSED!")
    print("==========================================")

if __name__ == '__main__':
    run_tests()
