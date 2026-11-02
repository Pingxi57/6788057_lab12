FROM python:3.12-slim-bookworm
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 10001 appuser
COPY --chown=appuser:appuser main.py ./
USER appuser
EXPOSE 8000
CMD ["python", "main.py"]
