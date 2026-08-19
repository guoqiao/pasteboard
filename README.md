# Pasteboard
Pasteboard is my redesigned and renamed update to PasteShack, a web app for easy image uploading. The live version is available at [http://pasteboard.co](http://pasteboard.co), and a development version that's running the code from the dev branch is up at [http://dev.pasteboard.co](http://dev.pasteboard.co).

Chrome extension repo: [https://github.com/JoelBesada/pasteboard-extension](https://github.com/JoelBesada/pasteboard-extension)

MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
Copyright 2012, Joel Besada

## Why this is open source
While future plans for Pasteboard might prevent me from keeping it open source, I've decided to share
the code for now for people to learn from. I'm also hoping that there are developers out there
who would like to contribute to the project by helping out with fixing bugs and adding / discussing new features.

I've provided instructions on how to set up your own copy of the app, but this is mainly to allow people
to fiddle around with the code and test it locally. Please don't publically host a copy of the app in an effort
to drive traffic to your site instead of mine for the exact same functionality. In other words, don't be a jerk.

## Running Locally
Here are the instructions for running the app for local testing:

__Step 1:__ Install [Node](http://nodejs.org/) and [Node Package Manager](https://npmjs.org/).  
__Step 2:__ Run the following commands in the terminal  
```
git clone https://github.com/JoelBesada/pasteboard.git
cd pasteboard
git checkout dev
npm install
sudo apt-get install imagemagick
./run_local
```
__Step 3 (Optional):__ Edit the example files in the _/auth_ folder with your credentials and rename them according to
the instructions inside the files. You can still run the app without doing this, but certain functions will be missing.

### Configuration

The following environment variables are supported:

- `PORT` — HTTP port (default `3000`, `4000` in development).
- `DOMAIN` — canonical host used for image/share page URLs, e.g. `https://pb.guoqiao.me`.
- `IMAGE_BASE_URL` — base URL the raw uploaded images are served from, e.g. `https://image.guoqiao.me/`.
  When unset, image URLs are derived from the incoming request (https when served behind a TLS proxy).

## Running with Docker on ARM64

The ARM64 image includes ImageMagick and persists local uploads in `public/storage`.
Install Docker on an ARM64 host, then build and run Pasteboard with:

```
make run
```

The app is available at <http://localhost:3000>. To publish the locally built image to Docker Hub, log in first and run:

```
./docker_tag_and_push.sh [TAG]
```

The default tag is `latest`; for example, `./docker_tag_and_push.sh v0.0.0` pushes `guoqiao/pasteboard:v0.0.0`.

The image is intentionally built from `Dockerfile.arm` with an ARM64 Node 24 base image. To use a different local image or tag when building, pass `IMAGE` and `TAG`, for example:

```
make build IMAGE=pasteboard TAG=v0.0.0
```

To publish that non-default tag, the push script currently expects the default local image name `pasteboard:latest`; tag it first if needed:

```
docker tag pasteboard:v0.0.0 pasteboard:latest
./docker_tag_and_push.sh v0.0.0
```

The Docker build context excludes local authentication files. Configure credentials by mounting the relevant files into `/app/auth` when running the container if needed.
