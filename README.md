GoPro Video Server Rx
---------------------

Capture and download clips through HTTP requests. The GoPro Hero4 Black was used for this quick hack. Not intended for production use. Use at your own risk.

## Usage:

This setup requires a connection to the GoPro camera via wifi and a LAN connection for incoming requests.

Start the server: `node app`

Once the server starts, the app will ping the GoPro every 2 seconds to keep it alive. During testing, the wireless connection to the GoPro would be lost after a few minutes of inactivity. Toggling wifi mode on the GoPro was necessary to establish connection again. Keeping active traffic on the network interface seemed to eliminate the problem.

### Example:

Capture a 5 second clip. The response object will contain the relative path to the media file.

Request: `http://localhost:3000/capture?t=5`
Response: `{ clip: "media/GOPR1234.MP4" }`

Note: The capture request returns immediately with the new file name, even if recording is still in progress. Some updates will be needed to request the file async.
