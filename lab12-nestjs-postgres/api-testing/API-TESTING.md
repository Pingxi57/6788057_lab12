# Lab 12 — Optional API testing with Postman or a terminal

**แนวทางเสริม: ทดสอบ API ด้วย Postman หรือ terminal**

Dr. Pisit Praiwattana, your mentor in 2026

Use this guide during parts 03–04 and your own project. Choose Postman **or** the
equivalent terminal workflow. This adds a way to collect the existing report
evidence; it does not add a new graded exercise or require an online deployment.

ใช้คู่มือนี้ร่วมกับส่วน 03–04 และโปรเจกต์ตนเอง เลือก Postman **หรือ** terminal
เป็นเครื่องมือทดสอบและเก็บหลักฐานเดิม ไม่ใช่งานส่งเพิ่ม และไม่ต้อง deploy ออนไลน์

## 1. Start the stack / เริ่มระบบ

Run in the chosen starter folder, with Docker running and your `.env` configured:

รันในโฟลเดอร์ starter ที่เลือก เปิด Docker และเตรียม `.env` ให้เรียบร้อย:

```text
docker compose up -d --build --wait
docker compose ps
```

| Example / ตัวอย่าง | `base_url` | `framework` | Invalid empty body / ข้อความว่าง |
| --- | --- | --- | --- |
| Express | `http://localhost:8082` | `express` | HTTP 400 |
| FastAPI | `http://localhost:8083` | `fastapi` | HTTP 422 |
| NestJS | `http://localhost:8084` | `nestjs` | HTTP 400 |

The HTTP client runs on your computer, so use **localhost and the published host
port**. `db:5432` is the database address **inside the Compose network**; do not
enter it into Postman. An HTTP 200 response from `/health` with
`database: connected` proves the app can query the database (`SELECT 1`),
rather than only that a process is listening.

เครื่องมือทดสอบอยู่บนคอมพิวเตอร์ของคุณ จึงใช้ **localhost และ host port ที่ publish**
ส่วน `db:5432` เป็นที่อยู่ PostgreSQL **ภายในเครือข่าย Compose** ไม่ใช่ URL สำหรับ
Postman เส้นทาง `/health` รัน `SELECT 1` เพื่อตรวจว่าแอปติดต่อฐานข้อมูลได้จริง

## 2. Import and configure Postman / นำเข้าและตั้งค่า Postman

1. Open the [Postman desktop app](https://www.postman.com/downloads/). If using
   Postman in a browser, install/select its **Desktop Agent** on the same computer
   as Docker. The Cloud Agent cannot reach your computer's localhost. The terminal
   alternative below does not require a Postman account or an extra API client.
2. Extract `api-testing.zip`. In Postman, use **Import** (in newer versions,
   **Use resources or import → Import**) and select
   `lab12-api.postman_collection.json` and `lab12-local.postman_environment.json`.
3. Select the **Lab12 local — choose framework** environment. Edit `base_url` and
   `framework` using the table above. Set `student_id` to your actual student ID
   and `note_body` to a unique marker such as `Lab12-6688123-postman-proof`.
4. Save the values. Use simple letters/digits/underscores/hyphens for the student
   ID (1–30 characters), and a nonempty marker of at most 200 characters. The
   sample values are examples, not your submission identity.
5. Send each request individually in the order below. After receiving a response,
   open **Test Results**. The checks are in **Scripts → Post-response** (older
   versions may label this **Tests**). Inspect both the response and test results.

1. เปิด Postman desktop หรือใช้เว็บ Postman พร้อม **Desktop Agent** บนเครื่องเดียว
   กับ Docker ส่วน Cloud Agent ติดต่อ localhost ของคุณไม่ได้ ถ้าไม่ต้องการใช้
   บัญชี Postman ให้ใช้คำสั่ง terminal ด้านล่างได้
2. แตก `api-testing.zip` แล้วนำเข้าไฟล์ collection และ environment ทั้งสองไฟล์
   ผ่าน **Import** (รุ่นใหม่อาจอยู่ที่ **Use resources or import → Import**)
3. เลือก environment **Lab12 local — choose framework** ตั้ง `base_url` และ
   `framework` ตามตาราง เปลี่ยน `student_id` และ `note_body` เป็นของตนเอง
4. บันทึกค่า ใช้รหัส 1–30 ตัวอักษร/ตัวเลข/ขีดกลาง/ขีดล่าง และข้อความไม่ว่างไม่เกิน
   200 ตัวอักษร อย่าใช้รหัสตัวอย่างเป็นรหัสของตนเอง
5. กด Send ทีละคำขอ หลังได้รับผลให้ดู **Test Results** และอ่านโค้ดตรวจสอบใน
   **Scripts → Post-response** (รุ่นเก่าอาจเรียก **Tests**)

No database password belongs in the Postman environment. These local demo APIs
have no API authentication. The teaching website's login protects the teaching
website; it is separate from your local demo API. Do not copy that password here.

ไม่ต้องใส่รหัสฐานข้อมูลใน Postman เพราะ API ตัวอย่าง local ไม่ได้เปิดระบบ login
รหัสเข้าเว็บไซต์บทเรียนเป็นคนละส่วนกับ API ของคุณ ไม่ต้องคัดลอกรหัสนั้นมาใส่

## 3. Send, inspect, and save one original row / สร้างและเก็บแถวต้นฉบับ

| Request | Action and expected result / สิ่งที่ทำและผลที่ควรได้ |
| --- | --- |
| **01 Health** | `GET {{base_url}}/health` → 200, `status: ok`, `database: connected`, correct framework / ตรวจแอปและ DB |
| **02 Create baseline ONCE** | `POST {{base_url}}/notes` → 201 and the created row; saves the original fields / สร้างแถวต้นฉบับครั้งเดียว |
| **03 Read original note (repeat after restart)** | `GET {{base_url}}/notes` → 200 array containing the saved row; checks all original fields / อ่านและตรวจแถวเดิม |
| **04 Invalid input (optional)** | POST with empty `body` → 400 in Express/NestJS, 422 in FastAPI; a rejection is the expected success / ส่งข้อมูลผิดเพื่อให้ API ปฏิเสธ |

Request 02 already selects **Body → raw → JSON** and sets
`Content-Type: application/json`. The two submitted fields are:

คำขอ 02 ตั้ง Body แบบ raw JSON และ header ให้แล้ว ตัวอย่างข้อมูลที่ส่ง:

```json
{
  "student_id": "6688123",
  "body": "Lab12-6688123-postman-proof"
}
```

Example Express response (your ID/time will differ):

ตัวอย่างผล Express (ID และเวลาจริงของคุณจะต่างกัน):

```json
{
  "id": "1",
  "student_id": "6688123",
  "body": "Lab12-6688123-postman-proof",
  "created_at": "2026-10-29T03:00:00.000Z"
}
```

`GET /notes` wraps records in an array: `[ { ... } ]`. FastAPI can return numeric
IDs instead of strings, and equivalent timestamp timezone formats. The tests
compare the ID as a string and the timestamp as an instant, while checking the
student ID and body exactly. They do not assume the first row belongs to you.

`GET /notes` คืน array ของแถวข้อมูล เช่น `[ { ... } ]` FastAPI อาจคืน ID แบบตัวเลข
และเวลาในรูปแบบ timezone ต่างกันแต่เป็นขณะเดียวกัน ชุดทดสอบจึงเทียบ ID เป็น string
และเทียบเวลาจริง ส่วนรหัสนักศึกษาและข้อความต้องตรงกัน และค้นหาด้วย ID เดิม

After a successful create, the collection saves `baseline_id`,
`baseline_student_id`, `baseline_body`, `baseline_created_at`, and
`baseline_base_url` as **collection variables**. Request 03 reads those variables
directly. Leave them in the collection; do not create environment variables with
those names. The selected environment provides the four configuration values.

เมื่อสร้างสำเร็จ collection จะบันทึกตัวแปร `baseline_*` ทั้งห้าตัวไว้ใน collection
คำขอ 03 อ่านจาก collection โดยตรง ไม่ต้องสร้างตัวแปรชื่อเดียวกันใน environment
ส่วน environment ใช้กำหนดค่าตั้งต้นสี่ตัวในขั้นตอน 2

## 4. Prove persistence with GET only / พิสูจน์ persistence ด้วย GET เท่านั้น

**Create the baseline only once. Do not rerun the entire collection, resend
request 02, or reinsert the row during the following experiment.** Recreating a
new row after a restart does not prove that the old row survived.

**สร้างแถวต้นฉบับเพียงครั้งเดียว ระหว่างทดลองห้ามรันทั้ง collection ห้ามส่ง 02 ซ้ำ
และห้าม INSERT แถวใหม่** การสร้างข้อมูลใหม่หลัง restart ไม่ได้พิสูจน์ว่าข้อมูลเดิมอยู่

Record the current DB container ID and volume, then take a screenshot of request
03's response and passing tests. In the same Compose folder, run:

บันทึก ID คอนเทนเนอร์ DB และ volume ถ่ายผลคำขอ 03 พร้อม tests จากนั้นรัน:

```text
docker compose ps -q db
docker inspect --format "{{json .Mounts}}" $(docker compose ps -q db)
docker compose restart
docker compose up -d --wait
```

Send **01**, then **03 only**. Expect HTTP 200 and the same original row. A plain
restart normally retains the container ID. Next, recreate containers without
deleting the volume:

ส่ง **01** แล้วส่ง **03 เท่านั้น** ต้องได้แถวเดิมหลัง restart จากนั้นสร้างคอนเทนเนอร์ใหม่:

```text
docker compose down
docker compose up -d --wait
docker compose ps -q db
docker inspect --format "{{json .Mounts}}" $(docker compose ps -q db)
```

Send **01**, then **03 only** again. Expect a **new DB container ID**, the **same
named volume**, and the **same original row** (ID, student, body, creation time).
Keep the Compose project name and `.env` student ID unchanged. Do not use
`docker compose down -v`: it deletes the declared named volume.

ส่ง **01** และ **03 เท่านั้น** อีกครั้ง ต้องได้ **ID คอนเทนเนอร์ DB ใหม่** แต่
**volume เดิมและแถวเดิม** รักษาชื่อ Compose project และรหัสใน `.env` ให้คงเดิม
ห้ามใช้ `down -v` ในขั้นตอนนี้ เพราะจะลบ named volume

Repeat the independent SQL check from the main guide. Replace the sample user
and database names if you customized them:

ตรวจด้วย SQL อีกทางตามคู่มือหลัก เปลี่ยนชื่อ user/database ถ้าคุณแก้ค่าตัวอย่าง:

```text
docker compose exec db psql -U lab12 -d lab12 -c "SELECT id, student_id, body, created_at FROM notes ORDER BY id;"
```

**Starting a different experiment/framework:** first save the existing evidence.
Explicitly clear all five `baseline_*` collection values, then update the selected
environment's URL/framework/student/marker. Send 01 → 02 once → 03 again. Request
02 preserves an existing baseline and fails its save-baseline test if resent;
it still creates a new database row, so avoid resending it by accident.

**เริ่มการทดลองใหม่หรือเปลี่ยน framework:** เก็บหลักฐานเดิมก่อน แล้วล้างค่า
`baseline_*` ทั้งห้าตัวโดยตั้งใจ เปลี่ยน environment ให้ตรง จากนั้นส่ง 01 → 02
ครั้งเดียว → 03 หากเผลอส่ง 02 ซ้ำ collection จะรักษา baseline เดิมและแสดง test
ที่ไม่ผ่าน แต่ API ยังสร้างแถวใหม่จริง จึงควรส่งเฉพาะ GET ระหว่างพิสูจน์ข้อมูล

## 5. Equivalent Windows PowerShell workflow / ทางเลือก PowerShell

No Postman is needed. Use a single PowerShell session so `$proof` stays available.
Change the URL for FastAPI/NestJS and replace the sample student ID/marker.

ไม่ต้องใช้ Postman ใช้ PowerShell หน้าต่างเดิมเพื่อเก็บ `$proof` เปลี่ยน URL และรหัส:

```powershell
$baseUrl = 'http://localhost:8082'
$studentId = '6688123'
$marker = "Lab12-$studentId-terminal-proof"
Invoke-RestMethod -Uri "$baseUrl/health"
$payload = @{ student_id = $studentId; body = $marker } | ConvertTo-Json
# Create ONCE / สร้างครั้งเดียว
$proof = Invoke-RestMethod -Method Post -Uri "$baseUrl/notes" -ContentType 'application/json' -Body $payload
$proof | ConvertTo-Json

# Reuse this function before/after both lifecycle tests; never POST again.
function Test-Lab12OriginalNote {
    $rows = Invoke-RestMethod -Uri "$baseUrl/notes"
    $original = @($rows | Where-Object { [string]$_.id -eq [string]$proof.id })
    if ($original.Count -ne 1) { throw 'Original row missing. Do not reinsert it.' }
    $row = $original[0]
    if ($row.student_id -cne $proof.student_id -or $row.body -cne $proof.body -or
        ([DateTimeOffset]$row.created_at) -ne ([DateTimeOffset]$proof.created_at)) {
        throw 'Original row changed.'
    }
    $row | ConvertTo-Json
    'PASS: original ID, student, body and creation instant are unchanged.'
}
Test-Lab12OriginalNote

docker compose restart
docker compose up -d --wait
Test-Lab12OriginalNote

docker compose down
docker compose up -d --wait
Test-Lab12OriginalNote
```

Capture container/volume IDs and SQL as in section 4. `Invoke-RestMethod` throws
on HTTP failures; a successful body alone does not replace the persistence
comparison. Keep this window open until your report evidence is complete.

เก็บ ID คอนเทนเนอร์/volume และ SQL ตามขั้นตอน 4 คำสั่งจะรายงาน error เมื่อ HTTP
ไม่สำเร็จ และฟังก์ชันจะตรวจแถวเดิมให้ อย่าปิดหน้าต่างก่อนเก็บหลักฐานเสร็จ

## 6. Equivalent macOS/Linux curl workflow / ทางเลือก curl

Use your own student ID/marker. `curl` displays the HTTP status and JSON below;
compare the original fields manually. This path requires no JSON parsing tool.

ใช้รหัส/ข้อความของตนเอง curl จะแสดง HTTP status และ JSON ให้เปรียบเทียบเอง
ไม่ต้องติดตั้งเครื่องมือแปลง JSON เพิ่ม:

```bash
base_url='http://localhost:8082'
curl -i "$base_url/health"
# Create ONCE; capture the returned id/body/student_id/created_at.
curl -i -X POST "$base_url/notes" \
  -H 'Content-Type: application/json' \
  -d '{"student_id":"6688123","body":"Lab12-6688123-terminal-proof"}'
curl -i "$base_url/notes"

docker compose restart
docker compose up -d --wait
curl -i "$base_url/notes"

docker compose down
docker compose up -d --wait
curl -i "$base_url/notes"
```

Expect 200 for health/GET and 201 for POST. After each lifecycle change, locate
the **same ID**, then compare student, marker, and creation instant. An HTTP 200
with an empty array is a successful HTTP request but **failed persistence proof**.
Use the container/volume and SQL commands from section 4 as independent evidence.

คาดหวัง 200 สำหรับ health/GET และ 201 สำหรับ POST หลังเปลี่ยน lifecycle ให้หา
**ID เดิม** แล้วเทียบรหัสนักศึกษา ข้อความ และเวลา HTTP 200 ที่ได้ array ว่าง
หมายถึงส่งคำขอสำเร็จ แต่ **ยังพิสูจน์ persistence ไม่ผ่าน** ตรวจด้วย volume และ SQL ด้วย

## 7. Evidence and troubleshooting / หลักฐานและแก้ปัญหา

Use screenshots from **your own screen** showing the method, URL, HTTP status,
JSON original row, and Postman Test Results (or the equivalent terminal output).
Place the baseline and before/after checks in report sections 03–04; include the
container ID/volume comparison and SQL row. For your own project adapt its route
and fields, preserving the same test idea. Submit the existing
`student_ID_lab12.PDF` to MyCourse; no extra report is required.

ถ่าย **หน้าจอของตนเอง** ให้เห็น method, URL, HTTP status, แถว JSON เดิม และ
Test Results หรือผล terminal ใส่หลักฐานในส่วน 03–04 พร้อมตาราง ID คอนเทนเนอร์/
volume และ SQL โปรเจกต์ตนเองปรับ route/fields ให้เหมาะ แต่ทดสอบแนวเดียวกัน
ส่งไฟล์เดิม `student_ID_lab12.PDF` ใน MyCourse ไม่ต้องทำรายงานเพิ่ม

| Symptom / อาการ | Check / ตรวจสอบ |
| --- | --- |
| Connection refused / ต่อไม่ได้ | Correct host port, Docker running, `docker compose ps` healthy; use desktop app/agent for localhost / ตรวจพอร์ตและสถานะ Docker |
| 404 | Route must be `/health` or `/notes`; no `/itcs258/Lab12` prefix on the demo API / อย่านำ path เว็บไซต์มานำหน้า API |
| 400/422 on valid POST | Body is raw JSON, correct Content-Type, string student ID, nonempty body / ตรวจ JSON และข้อมูลไม่ว่าง |
| 503 | API reached; DB unavailable. Inspect `docker compose logs --tail 30 app db` / ติดต่อ API ได้แต่ DB ไม่พร้อม |
| GET works but baseline test fails / อ่านได้แต่ test ไม่ผ่าน | Original baseline not created, changed URL/project/volume, or original row missing; inspect saved fields and SQL without reinserting / ตรวจ baseline และ SQL ห้ามสร้างแถวแทน |
| Wrong framework check / framework ไม่ตรง | Match both `base_url` and `framework` in the selected environment / แก้ทั้ง URL และ framework |

## Official references / เอกสารอ้างอิง

- [Import collections/environments](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/)
- [Desktop Agent and localhost limitations](https://learning.postman.com/docs/getting-started/basics/about-postman-agent/)
- [Post-response tests and Test Results](https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/)
- [Variable scopes and script access](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-variables/)

Menu names can vary between Postman versions. The imported requests contain the
scripts, so students can focus on sending requests and interpreting their results.

ชื่อเมนูอาจต่างตามรุ่น Postman ไฟล์นำเข้ามีสคริปต์ตรวจสอบพร้อมแล้ว เพื่อให้มุ่งที่
การส่งคำขอและอธิบายผลที่เกิดขึ้น
