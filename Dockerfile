FROM node:17.1.0

RUN apt update && \
  apt install -y

COPY ["package.json", "package-lock.json", "/usr/src/"]
WORKDIR /usr/src
RUN npm install npm@6
RUN npm install
EXPOSE 4000
CMD ["node", "index.js"]`
