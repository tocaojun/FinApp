#!/usr/bin/env python3
import requests
import json

print("=== 测试汇率API ===\n")

# 1. 登录
print("1. 登录...")
login_resp = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "testapi@finapp.com", "password": "testapi123"}
)
print(f"状态码: {login_resp.status_code}")
login_data = login_resp.json()
print(f"响应: {json.dumps(login_data, indent=2, ensure_ascii=False)}\n")

if not login_data.get('success'):
    print("✗ 登录失败")
    exit(1)

token = login_data['data']['token']
print(f"✓ 登录成功，Token: {token[:50]}...\n")

# 2. 调用汇率API
print("2. 调用汇率API...")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
rate_resp = requests.get(
    "http://localhost:8000/api/exchange-rates?page=1&limit=3",
    headers=headers
)
print(f"状态码: {rate_resp.status_code}")
rate_data = rate_resp.json()
print(f"响应: {json.dumps(rate_data, indent=2, ensure_ascii=False)}\n")

if rate_data.get('success'):
    print(f"✓ API调用成功")
    print(f"  总记录数: {rate_data['data']['total']}")
    print(f"  返回记录数: {len(rate_data['data']['rates'])}")
else:
    print(f"✗ API调用失败: {rate_data.get('message')}")
