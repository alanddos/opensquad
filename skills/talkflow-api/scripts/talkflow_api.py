#!/usr/bin/env python3
"""
TalkFlow API — Opensquad Skill
Interagir com o sistema TalkFlow via REST API.

Usage:
  python3 talkflow_api.py --action login --username "User" --password "pass"
  python3 talkflow_api.py --action upload-image --token "JWT" --tenant "empresa_1" --file "path.jpg"
  python3 talkflow_api.py --action create-template --token "JWT" --tenant "empresa_1" --phone-id "123" --template "template.json"
  python3 talkflow_api.py --action list-templates --token "JWT" --tenant "empresa_1" --phone-id "123"
  python3 talkflow_api.py --action send-test --token "JWT" --tenant "empresa_1" --phone-id "123" --template "name" --to "5567999999999"
  python3 talkflow_api.py --action list-connections --token "JWT" --tenant "empresa_1"
"""

import argparse
import json
import os
import sys
import requests

DEFAULT_BASE_URL = os.environ.get("TALKFLOW_BASE_URL", "https://api.agilsystem.com.br")
DEFAULT_TENANT = "empresa_1"
DEFAULT_PHONE_ID = "1033051686557792"


def login(base_url, username, password):
    r = requests.post(f"{base_url}/auth/login", json={"username": username, "password": password})
    r.raise_for_status()
    data = r.json()
    print(json.dumps({"action": "login", "token": data["access_token"], "user": data.get("user", {})}, ensure_ascii=False, indent=2))
    return data["access_token"]


def upload_image(base_url, token, tenant, filepath):
    with open(filepath, "rb") as f:
        files = {"file": (os.path.basename(filepath), f, "image/jpeg")}
        r = requests.post(
            f"{base_url}/api/{tenant}/meta-whatsapp/templates/upload-header-media",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
    r.raise_for_status()
    data = r.json()
    print(json.dumps({"action": "upload-image", "file": filepath, "result": data}, ensure_ascii=False, indent=2))
    return data


def create_template(base_url, token, tenant, phone_id, template_path):
    with open(template_path, "r") as f:
        template = json.load(f)
    r = requests.post(
        f"{base_url}/api/{tenant}/meta-whatsapp/templates",
        headers={"Authorization": f"Bearer {token}"},
        params={"phone_number_id": phone_id},
        json=template,
    )
    data = r.json()
    print(json.dumps({"action": "create-template", "status_code": r.status_code, "result": data}, ensure_ascii=False, indent=2))
    if r.status_code not in (200, 201):
        sys.exit(1)
    return data


def list_templates(base_url, token, tenant, phone_id):
    r = requests.get(
        f"{base_url}/api/{tenant}/meta-whatsapp/templates",
        headers={"Authorization": f"Bearer {token}"},
        params={"phone_number_id": phone_id},
    )
    r.raise_for_status()
    data = r.json()
    print(json.dumps({"action": "list-templates", "count": data.get("count", 0), "templates": data.get("templates", [])}, ensure_ascii=False, indent=2))
    return data


def send_test(base_url, token, tenant, phone_id, template_name, to):
    payload = {
        "to": to,
        "template_name": template_name,
        "language_code": "pt_BR",
        "phone_number_id": phone_id,
    }
    r = requests.post(
        f"{base_url}/api/{tenant}/meta-whatsapp/templates/send-test",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    data = r.json()
    print(json.dumps({"action": "send-test", "status_code": r.status_code, "result": data}, ensure_ascii=False, indent=2))
    if r.status_code not in (200, 201):
        sys.exit(1)
    return data


def list_connections(base_url, token, tenant):
    r = requests.get(
        f"{base_url}/api/{tenant}/whatsapp/connections",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    data = r.json()
    print(json.dumps({"action": "list-connections", "result": data}, ensure_ascii=False, indent=2))
    return data


def main():
    parser = argparse.ArgumentParser(description="TalkFlow API — Opensquad Skill")
    parser.add_argument("--action", required=True, choices=["login", "upload-image", "create-template", "list-templates", "send-test", "list-connections"])
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--username", default="Equipe Comercial")
    parser.add_argument("--password", default="")
    parser.add_argument("--token", default="")
    parser.add_argument("--tenant", default=DEFAULT_TENANT)
    parser.add_argument("--phone-id", default=DEFAULT_PHONE_ID)
    parser.add_argument("--file", default="")
    parser.add_argument("--template", default="")
    parser.add_argument("--to", default="")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")

    # Get token
    token = args.token
    if not token and args.action != "login":
        # Try to login automatically
        if args.password:
            token = login(base_url, args.username, args.password)
        else:
            print(json.dumps({"error": "No token provided and no password for auto-login"}, ensure_ascii=False))
            sys.exit(1)

    if args.action == "login":
        if not args.password:
            print(json.dumps({"error": "Password required for login"}, ensure_ascii=False))
            sys.exit(1)
        login(base_url, args.username, args.password)
    elif args.action == "upload-image":
        if not args.file:
            print(json.dumps({"error": "--file required"}, ensure_ascii=False))
            sys.exit(1)
        upload_image(base_url, token, args.tenant, args.file)
    elif args.action == "create-template":
        if not args.template:
            print(json.dumps({"error": "--template required"}, ensure_ascii=False))
            sys.exit(1)
        create_template(base_url, token, args.tenant, args.phone_id, args.template)
    elif args.action == "list-templates":
        list_templates(base_url, token, args.tenant, args.phone_id)
    elif args.action == "send-test":
        if not args.template or not args.to:
            print(json.dumps({"error": "--template and --to required"}, ensure_ascii=False))
            sys.exit(1)
        send_test(base_url, token, args.tenant, args.phone_id, args.template, args.to)
    elif args.action == "list-connections":
        list_connections(base_url, token, args.tenant)


if __name__ == "__main__":
    main()
