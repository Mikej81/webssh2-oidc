# Use debian:bookworm-slim runtime as a parent image
#FROM debian:bookworm-slim
FROM node:20-slim

#RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get update \
    && apt-get install -y curl python3 make g++\
    && apt-get -y autoclean

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json index.js ./

# Install production dependencies
RUN npm install -g npm@10.9.0

RUN npm i --audit=false --bin-links=false --fund=false --omit=dev

RUN npm install nodemon

COPY app/ ./app/

COPY config.json.sample config.json

# Set environment variables
ENV PORT=2222
ENV DEBUG=
ENV WEBSSH_SESSION_SECRET=

# Make port 2222 available to the world outside this container
EXPOSE 2222

# Run the app when the container launches
CMD ["npm", "start"]