import asyncio
from contextlib import asynccontextmanager
import os
from typing import Annotated

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
import psycopg
from psycopg.rows import dict_row
import uvicorn


def connect():
    # libpq reads PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD.
    return psycopg.connect(connect_timeout=3, row_factory=dict_row)


def database_ready():
    with connect() as connection:
        connection.execute('SELECT 1')


@asynccontextmanager
async def lifespan(_app):
    for attempt in range(1, 16):
        try:
            await asyncio.to_thread(database_ready)
            break
        except psycopg.Error:
            if attempt == 15:
                raise RuntimeError('Database did not become ready within the startup retry budget.') from None
            print(f'Waiting for database ({attempt}/15).', flush=True)
            await asyncio.sleep(2)
    yield
    # Requests use short-lived context-managed connections; none remain open.


app = FastAPI(title='Lab 12: FastAPI + PostgreSQL', lifespan=lifespan)


class NoteInput(BaseModel):
    student_id: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30, pattern=r'^[A-Za-z0-9_-]+$')]
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


@app.get('/')
def home():
    return {'message': 'Lab 12: FastAPI + PostgreSQL', 'lab': 12}


@app.get('/health')
def health():
    try:
        database_ready()
        return {'status': 'ok', 'database': 'connected', 'framework': 'fastapi'}
    except psycopg.Error:
        return JSONResponse(status_code=503, content={'status': 'error', 'database': 'unavailable', 'framework': 'fastapi'})


@app.get('/notes')
def notes():
    try:
        with connect() as connection:
            return connection.execute('SELECT id, student_id, body, created_at FROM notes ORDER BY id LIMIT 1000').fetchall()
    except psycopg.Error:
        raise HTTPException(status_code=503, detail='Database unavailable; retry after it recovers.') from None


@app.post('/notes', status_code=201)
def create_note(note: NoteInput):
    try:
        with connect() as connection:
            row = connection.execute(
                'INSERT INTO notes (student_id, body) VALUES (%s, %s) RETURNING id, student_id, body, created_at',
                (note.student_id, note.body),
            ).fetchone()
            return row
    except psycopg.Error:
        raise HTTPException(status_code=503, detail='Database unavailable; retry after it recovers.') from None


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '8000')))
