GoPro Video Server Rx
---------------------

Capture clips through rest commands and request the video file. Use at your own risk.

Example usage:

Capture a 5 second clip:

Request: http://localhost:3000/capture?t=5
Response: { clip: "media/GOPR1234.MP4" }

Note: The capture request returns immediately with the new file name, even if recording is still in progress. Stay tuned to find out how to wait for the file to be ready for serving.