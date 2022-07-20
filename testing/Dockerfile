FROM node:17.1.0


COPY ["package.json", "package-lock.json", "/usr/src/"]
WORKDIR /usr/src
RUN npm install

EXPOSE 5000

COPY . /usr/src/

CMD ["node", "index.js"]`
