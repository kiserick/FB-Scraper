# Welcome to Smagger Land


## Setup

Determine if node is already installed:

```bash
node --version
```

If no version is returned, then download and execute the [[https://nodejs.org/download/]](following) to install NodeJS

Run the following within the project direction to install the necessary dependencies:

```bash
npm install
```

Once node is available (and dependencies installed), ensure grunt is installed:

```bash
grunt --version
```

If not installed (no version number), then run the following to install:

```bash
sudo npm install -g grunt-cli
```



## Some useful commands
Initialise the environment HTTP request paths:

```bash
grunt init
```

Run tests:

```bash
grunt test
```

Run integration tests:

```bash
grunt integrate
``` 

## Generate bundle for IOS app

```bash
grunt ios
```

Note: Above path assumes that smagger-core and smagger-ios share the same parent directory
