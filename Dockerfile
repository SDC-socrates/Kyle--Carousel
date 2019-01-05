#FROM is the base image for which we will run our application
FROM node:latest


#Set working directory
RUN mkdir 
WORKDIR /client/public

# ADD files and directories from the application
ENV PATH node_modules/.bin:$PATH

# Define environment variable
ENV NAME FEC - TuRash

# Set proxy server, replace host:port with values for your servers
ENV http_proxy host:3055
ENV https_proxy host:3055

# install and cache app dependencies
COPY package.json 
# start app
CMD ["npm", "server"]

# Tell Docker we are going to use this port
EXPOSE 80

