# shout_to_gsr (shoutcast to Google Speech Recognition)

## Overview

This is a node.js showing how to use freeswitch/mod_shout record_session to convert speech to text using Google Speech Recognition.

This is a simple shoutcast server application that will send the audio received to Google Speech Recogntion service and print the result to the shell.

## Configuration

In your freeswitch dialplan, you will need an extension with actions like these (adjust SHOUT_TO_GSR_IP_ADDRESS)
```
  <action application='set' data='enable_file_write_buffering=false'/>
  <action application='answer'/>
  <action application='record_session' data='shout://user:pass@SHOUT_TO_GSR_IP_ADDRESS:9999/speech_recog?uuid=${uuid}'/>
  <action application='park'/>
```

You will also need to obtain a Google application credentials file with Speech Recognition (Speech-To-Text) support enabled.

## Testing

Start the server:

```
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials_file.json
node simple.js
```

Then make a call to reach the above dialplan and whatever you say will be converted to text and output to the shell.


But of course, you could do things like:
  - integrate this with an IVR platform like plivo
  - inject speech recogntion result into freeswitch
  - record audio to file

