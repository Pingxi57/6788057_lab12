# Lab 12 — Express + PostgreSQL 18

A two-service Compose continuation of Lab 11. It includes a database-aware
health route, parameterized notes routes and a named PostgreSQL volume.

Dr. Pisit Praiwattana, your mentor in 2026

## Start

Run commands in this folder. Docker Desktop must use Linux containers, or Docker
Engine with the Compose plugin must be available. You do not need to install
Node/Python/PostgreSQL on the host to use the container path.

Copy the example configuration, then set your student ID:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
notepad .env
```

```bash
# macOS / Linux
cp .env.example .env
```

The sample password is only a disposable localhost teaching value. Use a separate
secret for a real deployment. Keep `.env` out of Git and Docker's build context.

```text
docker compose config --quiet
docker compose up -d --build --wait
docker compose ps
docker compose logs --tail 30 app db
```

The app is at **http://localhost:8082**. It reaches the database at **db:5432**.
The container listens on 3000; only the app's host port is published. The
PostgreSQL 18 named volume mounts at `/var/lib/postgresql`.

## Create and read your own record

Replace the sample student ID and marker with your own.

```powershell
$note = @{ student_id = '6688123'; body = 'Lab12-6688123-my-first-note' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8082/notes' -ContentType 'application/json' -Body $note
Invoke-RestMethod -Uri 'http://localhost:8082/notes'
Invoke-RestMethod -Uri 'http://localhost:8082/health'
```

```bash
curl -X POST http://localhost:8082/notes -H 'Content-Type: application/json' -d '{"student_id":"6688123","body":"Lab12-6688123-my-first-note"}'
curl http://localhost:8082/notes
curl http://localhost:8082/health
```

POST returns HTTP 201 and the created row. GET `/notes` returns an array; an empty
array before you insert anything is expected. Note IDs can be strings in the Node
examples and numbers in Python. Compare the actual ID value, body and creation
instant rather than requiring identical JSON formatting across frameworks.

The health route runs `SELECT 1`. Success is:

```json
{"status":"ok","database":"connected","framework":"express"}
```

If the database becomes unavailable, API database requests return HTTP 503.
The Node examples recover through their connection pool; Python uses a fresh,
context-managed connection for each request. Initial connection attempts are
bounded. A Compose startup dependency does not replace this application behavior.
Invalid notes are rejected (HTTP 400 in Node, HTTP 422 validation in FastAPI).

Independently inspect the same data with SQL:

```text
docker compose exec db psql -U lab12 -d lab12 -c "SELECT id, student_id, body, created_at FROM notes ORDER BY id;"
```

Adapt `-U` and `-d` if you changed those example settings.

## Prove persistence after container replacement

Capture the original record and these values before each test:

```text
docker compose ps -q db
docker inspect --format "{{json .Mounts}}" $(docker compose ps -q db)
```

First restart, then retrieve your same record:

```text
docker compose restart
docker compose up -d --wait
```

Now remove and recreate the containers, retaining their named volume:

```text
docker compose down
docker compose up -d --wait
docker compose ps -q db
docker inspect --format "{{json .Mounts}}" $(docker compose ps -q db)
```

Repeat GET `/notes` and the SQL query. The DB container ID must change after
`down`/`up`, while the volume name and your original record remain. Do not reinsert
the proof row. Keep the same student ID/project name throughout this experiment.

This stack's project name is `lab12-express-${STUDENT_ID}`. Use a distinct
name such as `lab12-project-${STUDENT_ID}` for your own project so you do not
accidentally reuse these containers or this database volume from another folder.

## Configuration and initialization

`.env` supplies Compose interpolation values; `environment:` explicitly passes
them into each container. The app uses PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.
`db/init.sql` runs only when the database data directory is empty. Editing it or
changing POSTGRES_PASSWORD in `.env` does not update an existing initialized DB.
Use migrations/SQL changes for existing data; do not switch PostgreSQL majors
against the same data directory without a migration.

The lab uses the image's bootstrap account to keep setup small. A production
system should use an appropriate least-privilege application role, deliberate
secret management and a backup/recovery plan. A named volume is not a backup.

## Finish and report

```text
docker compose down
```

Keep the named volume until your screenshots and report are complete. `down -v`
deletes this project's declared named volume and is not the normal cleanup step.
Only use it deliberately with disposable practice data.

Complete all Lab 12 parts 01–04 plus your own project, capture actual commands
and results from your own screen, then submit `student_ID_lab12.PDF` to the Lab 12
assignment on MyCourse. Replace `student_ID` with your actual student ID.

ทำ Lab 12 ให้ครบ 01–04 และโปรเจกต์ของตนเอง บันทึกคำสั่งและผลจริงจากหน้าจอของตนเอง
ส่งรายงาน `student_ID_lab12.PDF` ใน MyCourse โดยแทนรหัสนักศึกษาของตนเอง

## Optional Postman or equivalent API checks / ทดสอบ API ด้วย Postman หรือ terminal

Use the bilingual [API testing guide](api-testing/API-TESTING.md) in the downloaded
starter. Source checkout users can read [the shared guide](../../api-testing/API-TESTING.md).
The same guide/collection is available from the Lab 12 website as api-testing.zip.
Import the collection and environment, select this framework's host URL and
framework value, then replace the sample student ID and marker with your own.
The guide includes PowerShell and curl alternatives without Postman.

นำเข้า collection และ environment จากโฟลเดอร์ api-testing ใน starter ZIP เลือก URL
และ framework ให้ตรง เปลี่ยนรหัสนักศึกษา/ข้อความเป็นของตนเอง หรือใช้ PowerShell/curl
ตามคู่มือสองภาษา ไม่ต้องส่งงานเพิ่ม

Send Health, Create baseline **once**, then Read original note. During restart
and down/up, resend **GET only**; do not recreate the proof row or rerun the whole
collection. Saved baseline fields stay unchanged. Include method, URL, status,
JSON and test results in the existing report sections 03–04.

ส่ง Health แล้ว Create baseline **ครั้งเดียว** จากนั้น Read original note หลัง restart
และ down/up ให้ส่ง **GET เท่านั้น** ห้ามสร้างแถวใหม่เพื่อแทนหลักฐานเดิม เก็บ method,
URL, status, JSON และผล tests ในรายงานส่วน 03–04 เดิม
