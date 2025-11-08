# Use an official Node.js base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on (change if needed)
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]
