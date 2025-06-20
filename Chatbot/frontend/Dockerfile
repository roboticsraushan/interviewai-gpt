# Use Node 18 image
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the full app source
COPY . .
#this creates /app/build
RUN npm run build 

#EXPOSE 3000
# Start the React app
#CMD ["npm", "start"]

