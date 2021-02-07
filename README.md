# shout_to_gsr (shoutcast to Google Speech Recognition)

## Overview

This is a simple node.js app showing how to use freeswitch/mod_shout record_session to convert speech to text using Google Speech Recognition.

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

Then make a call (or several simultaneous calls) to reach the above dialplan and whatever you say will be converted to text and output to the shell.

Sample output:
```
$ node simple.js
2021-02-07 11:41:05: Listening on port 9999
2021-02-07 11:41:35: new client arrived
{
  method: 'SOURCE',
  url: '/speech_recog?uuid=b047c2d0-d603-48c1-b2c8-1bd4815828e0',
  version: { major: 1, minor: 0 },
  headers: {
    host: '192.168.2.138:9999',
    'user-agent': 'libshout/2.4.1',
    'content-type': 'audio/mpeg',
    'ice-public': '0',
    'ice-name': 'no name',
    'ice-url': 'http://www.freeswitch.org',
    'ice-description': 'FreeSWITCH mod_shout Broadcasting Module',
    'ice-audio-info': 'bitrate=24000'
  }
}
2021-02-07 11:41:35: b047c2d0-d603-48c1-b2c8-1bd4815828e0 MP3 format: {"raw_encoding":208,"sampleRate":8000,"channels":1,"signed":true,"float":false,"ulaw":false,"alaw":false,"bitDepth":16}                     
2021-02-07 11:41:37: Transcription: Hello.
2021-02-07 11:41:38: Transcription: Hello.
2021-02-07 11:41:38: Transcription: Hello,
2021-02-07 11:41:39: Transcription: Hello, how are you?
2021-02-07 11:41:42: Transcription:  Hello.
2021-02-07 11:41:43: Transcription:  Hello.
2021-02-07 11:41:43: Transcription:  Hello,
2021-02-07 11:41:44: Transcription:  Hello, how are you?
2021-02-07 11:41:46: b047c2d0-d603-48c1-b2c8-1bd4815828e0 socket close
```


But of course, you could do things like:
  - integrate this with an IVR platform like plivo
  - inject speech recognition result into freeswitch event system
  - record audio to file

