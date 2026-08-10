FROM python:3.14.6-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN addgroup --system forge && adduser --system --ingroup forge forge

WORKDIR /app

COPY requirements/base.txt requirements/base.txt
RUN python -m pip install --no-cache-dir -r requirements/base.txt

COPY --chown=forge:forge . .
RUN chmod +x /app/entrypoint.sh \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R forge:forge /app/staticfiles /app/media

USER forge

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/', timeout=3)"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--no-control-socket"]
