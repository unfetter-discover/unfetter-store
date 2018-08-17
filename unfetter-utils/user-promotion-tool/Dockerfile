FROM python:2.7-slim
RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential
COPY . /
WORKDIR /
RUN pip install --trusted-host pypi.python.org -r requirements.txt

