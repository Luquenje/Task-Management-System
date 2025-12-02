# # Use Node.js LTS version as base image
# FROM node:20-alpine

# # Set working directory in container
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy application files
# COPY . .

# # Expose port (default 5001)
# EXPOSE 5001

# # Set environment to production
# ENV NODE_ENV=production

# # Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# # Start the application
# CMD ["node", "app.js"]

# Build the application and install production dependencies
FROM node:20-alpine

# Set working directory in container
WORKDIR /app

# Copy the packaged dependencies
COPY ./task-microservice-1.0.0.tgz ./

# Copy package files
COPY package*.json ./

# install the node dependencies from the copied packaged dependencies
RUN npm install task-microservice-1.0.0.tgz --prefix ./temp

# compare the package.json file with the original one that already exists in the container
# RUN cmp package.json ./temp/node_modules/task-microservice/package.json

# move the node modules to the root folder
RUN mv ./temp/node_modules/task-microservice/node_modules ./

# Copy all source code after installing dependencies to optimize cache
COPY . .

# remove the temp folder and tgz
RUN rm -r ./temp/ ./task-microservice-1.0.0.tgz

# Set the correct ownership and copy only the necessary files
RUN adduser -u 4000 -H -D tmsappuser && chmod -R 755 /app /tmp 

# Switch to the non-root user for security
USER tmsappuser

EXPOSE 8081
CMD ["node", "index.js"]