const net = require('net')
var httpHeaders = require('http-headers')

const querystring = require('querystring')

const speech = require('@google-cloud/speech')

const OlarisSpeechRecogStream = require('olaris-speech-recog-stream')

const lame = require('lame')

const speech_client = new speech.SpeechClient()

const m = require('moment')

const config = require('config')

const _ = require('lodash')

const FileWriter= require('wav').FileWriter

var log = function(msg) {
    const now = m().format("YYYY-MM-DD HH:mm:ss")
    console.log(`${now}: ${msg}`)
}

var start_speech_recog_for_google = function(uuid, language, socket, initial_data) {
    var decoder = new lame.Decoder()
	var recognizeStream = null

    var fileWriter = null

    decoder.on('format', (format) => {
        log(`${uuid} MP3 format: ${JSON.stringify(format)}`)

		const encoding = 'LINEAR16'
		const sampleRateHertz = format.sampleRate 
		const languageCode = language

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

        if(config.audio_dump_folder) {
            const filePath = `${config.audio_dump_folder}/${uuid}.wav`
            fileWriter = new FileWriter(filePath, format)
            decoder.pipe(fileWriter)
        }
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
		    recognizeStream = null
		}

        if(fileWriter) {
           fileWriter.end()
           fileWriter = null
        }
    })

    socket.on('error', () => {
        log(`${uuid} socket error ${error}`)
        decoder.unpipe(recognizeStream)
		if(recognizeStream) {
        	recognizeStream.end()
		    recognizeStream = null
		}

        if(fileWriter) {
           fileWriter.end()
           fileWriter = null
        }
    })
}


var start_speech_recog_for_olaris = function(uuid, language, socket, initial_data) {
    var decoder = new lame.Decoder()
	var stream1 = null
	var stream2 = null

    var fileWriter1 = null
    var fileWriter2 = null

    decoder.on('format', (format) => {
        log(`${uuid} MP3 format: ${JSON.stringify(format)}`)

		const context = null

		var cfg = _.clone(config.olaris)
		cfg.src_encoding = 'LINEAR16'
        cfg.sampling_rate = 16000 // it seems lame decoder will convert to 16000

		stream1 = new OlarisSpeechRecogStream(uuid, language, null, cfg)
		stream1.on('data', data => {
			log(`${uuid} Channel=1 Transcription: ${data.transcript}`)
		})
		stream1.on('close', () => {
			log(`${uuid} stream1 close`)
		})
		stream1.on('error', err => {
			log(`${uuid} stream1 error ${err}`)
		})
	 
		if(format.channels > 1) {
			stream2 = new OlarisSpeechRecogStream(uuid, language, null, cfg)
			stream2.on('data', data => {
			    log(`${uuid} Channel=2 Transcription: ${data.transcript}`)
			})
			stream2.on('close', () => {
				log(`${uuid} stream2 close`)
			})
            stream2.on('error', err => {
			    log(`${uuid} stream2 error ${err}`)
            })
		}

        if(config.audio_dump_folder) {
            const filePath = `${config.audio_dump_folder}/${uuid}_1.wav`
            fileWriter1 = new FileWriter(filePath, {
		        sampleRate: 16000, // it seems lame decoder will convert to 16000
                channels: 1,
            })

            if(format.channels > 1) {
                const filePath = `${config.audio_dump_folder}/${uuid}_2.wav`
                fileWriter2 = new FileWriter(filePath, {
		            sampleRate: 16000, // it seems lame decoder will convert to 16000
                    channels: 1,
                })
            }
        }

        decoder.on('data', data => {
			if(format.channels == 1) {
				stream1.write(data)

                if(fileWriter1) {
                    fileWriter1.write(data)
                }
			} else {
				var a1 = []
				var a2 = []
				for(var i=0 ; i<data.length/2 ; i+=2) {
					a1[i*2] = data[i*2]
					a1[i*2+1] = data[i*2+1]

					a2[i*2] = data[i*2+2]
					a2[i*2+1] = data[i*2+1+2]
				}

                var b1 = Buffer.from(a1)
                var b2 = Buffer.from(a2)

                stream1.write(b1)
                stream2.write(b2)

                if(fileWriter1) {
				    fileWriter1.write(b1)
                }

                if(fileWriter2) {
				    fileWriter2.write(b2)
                }
			}
		})
    })

    //decoder.on('data', data => log(`${uuid} MP3 data`))

    if(initial_data != "") {
        decoder.write(Buffer.from(initial_data))
    }

    socket.pipe(decoder)

    //socket.on('data', data => log(`${uuid} socket data length=${data.length}`))

    socket.on('close', () => {
        log(`${uuid} socket close`)
		if(stream1) {
        	stream1.end()
		}
		stream1 = null
		if(stream2) {
        	stream2.end()
		}
		stream2 = null

        if(fileWriter1) {
           fileWriter1.end()
           fileWriter1 = null
        }

        if(fileWriter2) {
           fileWriter2.end()
           fileWriter2 = null
        }
    })

    socket.on('error', () => {
        log(`${uuid} socket error ${error}`)
		if(stream1) {
        	stream1.end()
		}
		stream1 = null
		if(stream2) {
        	stream2.end()
		}
		stream2 = null

        if(fileWriter1) {
           fileWriter1.end()
           fileWriter1 = null
        }

        if(fileWriter2) {
           fileWriter2.end()
           fileWriter2 = null
        }
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

        var engine = config.default_engine
        if(params.engine) {
            engine = params.engine
        }

        var language = config.default_language
        if(params.language) {
            language = params.language
        }

		if(engine == 'google') {
        	start_speech_recog_for_google(uuid, language, socket, rest)
		} else {
        	start_speech_recog_for_olaris(uuid, language, socket, rest)
		}
    } 
 
    socket.once('data', handshake)
})

const PORT = 8090

server.listen(PORT, "0.0.0.0", () => { log(`Listening on port ${PORT}`) })

