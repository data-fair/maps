# data-fair/maps

## Development

### Setup development environment
Install maplibre-gl-native

    TODO

Install node dependencies:

    npm i

Pull and start service dependencies

    docker-compose up -d

Download openmaptiles styles

    node scripts/import-openmaptiles-style.js 

### Run development servers
Run the 2 development servers with these commands in separate shells:

    npm run dev-server
    npm run dev-client

Server listening to [http://localhost:7400](http://localhost:7400)

### Run test

Run tests:

    npm run test
    npm run test-cover
