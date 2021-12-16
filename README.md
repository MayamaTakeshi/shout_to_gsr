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

Obs: the credentials (user:pass) are required by mod_shout to be present in the URL even if the server doesn't check them.

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
2021-02-07 12:18:49: Listening on port 9999
2021-02-07 12:18:57: new client arrived
{
  method: 'SOURCE',
  url: '/speech_recog?uuid=dd0993bf-ae11-41ad-a6bd-188f6aedfd49',
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
2021-02-07 12:18:57: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 MP3 format: {"raw_encoding":208,"sampleRate":8000,"channels":1,"signed":true,"float":false,"ulaw":false,"alaw":false,"bitDepth":16}                     
2021-02-07 12:18:59: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription: Hello.
2021-02-07 12:19:00: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription: Hello.
2021-02-07 12:19:00: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription: Hello,
2021-02-07 12:19:01: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription: Hello, how are you?
2021-02-07 12:19:03: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription:  Hello.
2021-02-07 12:19:05: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription:  Hello.
2021-02-07 12:19:05: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription:  Hello,
2021-02-07 12:19:06: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription:  Hello, how are you?
2021-02-07 12:19:08: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 Transcription:  Hello.
2021-02-07 12:19:09: dd0993bf-ae11-41ad-a6bd-188f6aedfd49 socket close

```


But of course, you could do things like:
  - write an outbound event socket IVR app with Speech Recognition support
  - integrate this with an IVR platform like plivo
  - inject speech recognition result into freeswitch event system
  - record audio to file

## Warning

Note that in the dialplan we are setting: enable_file_write_buffering=false

This is required to avoid delay when sending data out.

However, if you start recording the call to a file this must set to true (enable_file_write_buffering=true) otherwise writing to HD will be inefficient. 

See:
  https://lists.freeswitch.org/pipermail/freeswitch-users/2009-February/038909.html

## Using Freeswitch API

Instead of using from the dialplan you can also use the API and send the recording command directly to the channel. Like this:
```
uuid_setvar c8b49c20-8407-423a-a2e5-ff71bf14c271 RECORD_STEREO true
uuid_setvar c8b49c20-8407-423a-a2e5-ff71bf14c271 enable_file_write_buffering false
uuid_record c8b49c20-8407-423a-a2e5-ff71bf14c271 start http://user:pass@127.0.0.1:9999/transcribe?domain_name=test1.com&uuid=c8b49c20-8407-423a-a2e5-ff71bf14c271
```

And the result would be like this:
```
$ node simple.js
2021-12-16 16:29:16: Listening on port 9999
2021-12-16 16:29:21: new client arrived
{
  method: 'SOURCE',
  url: '/transcribe?domain_name=test.com&uuid=c8b49c20-8407-423a-a2e5-ff71bf14c271',                                                                                               
  version: { major: 1, minor: 0 },
  headers: {
    host: '127.0.0.1:9999',
    'user-agent': 'libshout/2.4.1',
    'content-type': 'audio/mpeg',
    'ice-public': '0',
    'ice-name': 'no name',
    'ice-url': 'http://www.freeswitch.org',
    'ice-description': 'FreeSWITCH mod_shout Broadcasting Module',
    'ice-audio-info': 'bitrate=24000'
  }
}
2021-12-16 16:29:21: c8b49c20-8407-423a-a2e5-ff71bf14c271 MP3 format: {"raw_encoding":208,"sampleRate":8000,"channels":2,"signed":true,"float":false,"ulaw":false,"alaw":false,"bitDepth":16}             
2021-12-16 16:29:26: c8b49c20-8407-423a-a2e5-ff71bf14c271 Channel=2 Transcription: children live
2021-12-16 16:29:31: c8b49c20-8407-423a-a2e5-ff71bf14c271 Channel=2 Transcription:  yo so my heart sounds of you                                                                                          
2021-12-16 16:29:36: c8b49c20-8407-423a-a2e5-ff71bf14c271 Channel=2 Transcription:  Hillsborough live                                                                                                     
2021-12-16 16:29:43: c8b49c20-8407-423a-a2e5-ff71bf14c271 socket close
2021-12-16 16:29:44: c8b49c20-8407-423a-a2e5-ff71bf14c271 Channel=1 Transcription: my heart sounds you 
```

