
#файл подчистую позаимствовал с docker/awesome-compose
FROM  python:3.14-alpine AS builder

WORKDIR /code
COPY requirements.txt /code
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install -r requirements.txt

COPY . .
COPY ./static ./static
COPY ./templates ./templates

ENV FLASK_APP main.py
ENV FLASK_ENV production
ENV FLASK_DEBUG=0
ENV FLASK_RUN_PORT 3000
ENV FLASK_RUN_HOST 0.0.0.0

EXPOSE 3000

CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:3000", "main:app"]
