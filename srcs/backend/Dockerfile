FROM python:3.12-alpine as builder

RUN apk add --no-cache postgresql-dev gcc python3-dev musl-dev

RUN pip install poetry==1.7.1

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /data

COPY pyproject.toml ./

RUN --mount=type=cache,target=$POETRY_CACHE_DIR poetry install --no-root

FROM python:3.12-alpine as runtime

RUN apk add --no-cache postgresql-dev gcc python3-dev musl-dev

ENV VIRTUAL_ENV=/data/.venv \
    PATH="/data/.venv/bin:$PATH"

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

COPY transcendence_backend transcendence_backend
COPY README.md .
COPY entrypoint.sh .

WORKDIR /transcendence_backend

ENTRYPOINT [ "../entrypoint.sh" ]

# CMD [ "python", "manage.py", "migrate"]

# ENTRYPOINT ["python3", "manage.py", "runserver", "0.0.0.0:8000"]