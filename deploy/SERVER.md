# MLS Server Information

## VPS Details

| Property       | Value               |
|----------------|---------------------|
| Provider       | (ghi nhà cung cấp)  |
| IP Address     | 103.20.97.97        |
| SSH User       | root                |
| SSH Auth       | Password (xem `.env.secret` — KHÔNG commit) |
| OS             | Ubuntu 22.04 LTS    |
| Location       | (ghi datacenter)    |

## Domain

> Chưa cấu hình domain. Cập nhật khi có.

## Ports

| Service    | Port  | Notes                  |
|------------|-------|------------------------|
| SSH        | 22    |                        |
| HTTP       | 80    | Nginx reverse proxy    |
| HTTPS      | 443   | Nginx + Let's Encrypt  |
| Backend    | 5009  | Internal only          |
| Frontend   | 3000  | Internal only          |
| PostgreSQL | 5432  | Internal only          |

## Application Paths on Server

```
/opt/mls/
├── backend/          # .NET 10 published binaries
├── frontend/         # Next.js production build
├── nginx/            # Nginx config
├── media/            # Uploaded media files (D:\MLSMedia\ → /opt/mls/media/)
└── logs/             # Application logs

/etc/systemd/system/
├── mls-backend.service
└── mls-frontend.service
```

## Connect via SSH

```bash
ssh root@103.20.97.97
```

## Database

- Engine: PostgreSQL 16
- Database: `mls`
- Schema: `tenant_demo`
- Connection string stored in: `/opt/mls/backend/appsettings.Production.json`

## Quick Status Commands (trên server)

```bash
# Xem trạng thái services
systemctl status mls-backend mls-frontend nginx postgresql

# Xem logs backend
journalctl -u mls-backend -f

# Xem logs frontend
journalctl -u mls-frontend -f

# Restart services
systemctl restart mls-backend mls-frontend
```

## Deployment

Chạy từ máy dev:
```bash
# Windows (PowerShell)
.\deploy\deploy.ps1

# Linux/macOS
bash deploy/deploy.sh
```

---
*Cập nhật lần cuối: 2026-05-15*
