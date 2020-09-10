const express = require("express");
const path = require("path");
var redis = require("./redis.js");
var utils = require("./methods.js");

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var porta = process.env.PORT || 8080;

app.use('/', (req,res) => {
	// console.log("Conectado na porta " + porta);
});

io.on('connection', async socket => {
	console.log(`Socket conectado: ${socket.id}`);
	socket.on('openChatRoom', async data => {
		await utils.data.hasChat(data.user_id_1,data.user_id_2).then(async function(value) {
			if(!value) {
			// console.log("Creating chat room ...")
			utils.data.createChatRoom(data.user_id_1,data.user_id_2);
			} else {
				var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
				await utils.data.loadChatMessages(chatHash).then(function(msg) {
					console.log(msg)
					msg.forEach(async k => {
						if(k) {
							await redis.data.hGetKeyAll(k).then(function(v) {
								var message = '{'
							       +'"message" : '+v.message+','
							       +'"datetime"  : '+v.datetime+','
							       +'"user_id" : '+v.user_id+''
							       +'}';
								   socket.send(message);
							});
						}
					});
				});
				// console.log("Loading messages ...")
			}
		});
	});

	app.use('/sendMessage', (req,res) => {
		socket.on('sendMessage', data => {
		// console.log("Sending message ...")
		var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
		console.log(req);
		utils.data.saveChatMessages(data.user_id_1,chatHash,data.message);
		var message = '{'
				       +'"message" : '+data.message+','
				       +'"datetime"  : '+utils.data.getTimestamp()+','
				       +'"user_id" : '+data.user_id_1+''
				       +'}';
		socket.send(message);
		});	
	});

});

server.listen(porta);


