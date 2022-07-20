FROM node:17.1.0


COPY ["package.json", "/usr/src/"]
WORKDIR /usr/src
RUN npm install

EXPOSE 4000

COPY . /usr/src/

CMD ["npm", "start"]`
