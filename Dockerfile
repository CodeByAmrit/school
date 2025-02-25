FROM node:latest AS build

RUN apt update -y 
RUN apt upgrade -y 

RUN mkdir school

RUN git clone https://github.com/CodeByAmrit/school.git school 

RUN cd school && npm install -g pm2 && npm install

CMD ["pm2-runtime", "start", "school/app.js"]


