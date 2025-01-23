FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install global packages
RUN npm install -g npm@latest \
    npm install -g typescript \
    npm install -g eslint \
    npm install -g @types/react

# Set the default shell to bash
SHELL ["bash", "-c"]

# Expose ports for development
EXPOSE 3000 5173

# Default command
CMD ["bash"]