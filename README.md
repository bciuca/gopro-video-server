GoPro Video Server Rx
---------------------

Capture clips through rest commands and request the video file. Use at your own risk.

## Usage:

Connect to the GoPro Hero4 via wifi. Remote connection to the server requires a separate network connection (e.g. hard lined).

Start the server: `node app`

Once the server starts, the app will ping the GoPro every 2 seconds to keep it alive -- a work around for the connection dropping after a few minutes of inactivity.

### Example:

Capture a 5 second clip:

Request: `http://localhost:3000/capture?t=5`
Response: `{ clip: "media/GOPR1234.MP4" }`

Note: The capture request returns immediately with the new file name, even if recording is still in progress. Some updates may be needed to request for the status of the file.
