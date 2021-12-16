const net = require('net')
var httpHeaders = require('http-headers')

const querystring = require('querystring')

const speech = require('@google-cloud/speech')

const lame = require('lame')

const speech_client = new speech.SpeechClient()

const m = require('moment')

var log = function(msg) {
    const now = m().format("YYYY-MM-DD HH:mm:ss")
    console.log(`${now}: ${msg}`)
}

var start_speech_recog = function(uuid, socket, initial_data) {
    var decoder = new lame.Decoder()
	var recognizeStream = null

    decoder.on('format', (format) => {
        log(`${uuid} MP3 format: ${JSON.stringify(format)}`)

		const encoding = 'LINEAR16'
		const sampleRateHertz = 8000
		const languageCode = 'en-US'

		const request = {
			config: {
				encoding: encoding,
				sampleRateHertz: sampleRateHertz,
				languageCode: languageCode,
				audioChannelCount: format.channels,
				enableSeparateRecognitionPerChannel: true,
			},
			interimResults: true, // If you want interim results, set this to true
		};

		// Stream the audio to the Google Cloud Speech API
		recognizeStream = speech_client.streamingRecognize(request)
		.on('error', error => {
			log(`${uuid} recognizeStream error ${error}`)
		})
		.on('data', data => {
		//log(JSON.stringify(data))
		if(data.results[0].isFinal) {
				 log(`${uuid} Channel=${data.results[0].channelTag} Transcription: ${data.results[0].alternatives[0].transcript}`)
			}
		})
		.on('close', () => {
			log(`${uuid} recognizeStream close`)
		})
	 
        decoder.pipe(recognizeStream)
    })

    //decoder.on('data', data => log(`${uuid} MP3 data`))

    if(initial_data != "") {
        decoder.write(Buffer.from(initial_data))
    }

    socket.pipe(decoder)

    //socket.on('data', data => log(`${uuid} socket data length=${data.length}`))

    socket.on('close', () => {
        log(`${uuid} socket close`)
        decoder.unpipe(recognizeStream)
		if(recognizeStream) {
        	recognizeStream.end()
		}
		recognizeStream = null
    })

    socket.on('error', () => {
        log(`${uuid} socket error ${error}`)
        decoder.unpipe(recognizeStream)
		if(recognizeStream) {
        	recognizeStream.end()
		}
		recognizeStream = null
    })
}


const server = net.createServer()
server.on('connection', socket => {
    log('new client arrived')

    var acc = ""

    var handshake = function(data) {
        acc = acc + data.toString()
        var idx = acc.indexOf("\r\n\r\n")
        if(idx < 0) {
            socket.once('data', handshake)
            return
        }

        var msg = acc.slice(0, idx)
        var headers = httpHeaders(msg)
        console.dir(headers)
        socket.write("HTTP/1.1 200 OK\r\n\r\n")

        var params = querystring.parse(headers.url.split("?")[1])
        //console.log(params)
        var uuid = params.uuid

        var rest = acc.slice(idx+4)

        start_speech_recog(uuid, socket, rest)
    } 
 
    socket.once('data', handshake)
})

const PORT = 9999

server.listen(PORT, "0.0.0.0", () => { log(`Listening on port ${PORT}`) })

